/**
 * Zoho Invoice データインポートスクリプト
 * 使い方: npx ts-node --project tsconfig.scripts.json scripts/import-zoho.ts <zipfile>
 *
 * インポート対象:
 *  - 連絡先.csv  → Customer
 *  - 商品.csv    → ItemMaster
 *  - 見積書.csv  → Estimate + EstimateLineItem
 *  - 請求書.csv  → Invoice  + InvoiceLineItem
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';

// ── CSV パーサー（ダブルクォート・改行対応） ────────────────────────────
function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === '\n' && !inQuote) {
      lines.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);

  const splitLine = (line: string): string[] => {
    const fields: string[] = [];
    let f = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { f += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        fields.push(f); f = '';
      } else {
        f += ch;
      }
    }
    fields.push(f);
    return fields;
  };

  const [headerLine, ...dataLines] = lines.filter(l => l.trim() !== '');
  const headers = splitLine(headerLine.replace(/\r$/, ''));
  return dataLines.map(line => {
    const vals = splitLine(line.replace(/\r$/, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

function readCsv(dir: string, name: string): Record<string, string>[] {
  const fp = path.join(dir, name);
  if (!fs.existsSync(fp)) return [];
  return parseCsv(fs.readFileSync(fp, 'utf-8'));
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseFloat2(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, '') || '0');
  return isNaN(n) ? 0 : n;
}

// ── ステータスマッピング ──────────────────────────────────────────────────
const ESTIMATE_STATUS: Record<string, string> = {
  draft:    'DRAFT',
  sent:     'SENT',
  accepted: 'APPROVED',
  invoiced: 'INVOICED',
  expired:  'EXPIRED',
  rejected: 'REJECTED',
};
const INVOICE_STATUS: Record<string, string> = {
  Open:    'SENT',
  Closed:  'PAID',
  Overdue: 'OVERDUE',
  Void:    'DRAFT',
};

// ── メイン ───────────────────────────────────────────────────────────────
async function main() {
  // ZIPを展開（cross-platform）
  const zipArg = process.argv[2];
  let dataDir: string;
  if (zipArg) {
    dataDir = path.join(os.tmpdir(), 'zoho_import_work');
    fs.mkdirSync(dataDir, { recursive: true });
    const zip = new AdmZip(zipArg);
    zip.extractAllTo(dataDir, true);
    console.log(`Extracted to ${dataDir}`);
  } else {
    dataDir = path.join(os.tmpdir(), 'zoho_export');
    if (!fs.existsSync(dataDir)) {
      console.error('ZIPファイルのパスを引数に渡してください:');
      console.error('  npm run import:zoho -- "path/to/export.zip"');
      process.exit(1);
    }
  }

  const prisma = new PrismaClient();

  try {
    // ── 1. 顧客 ────────────────────────────────────────────────────────────
    console.log('Importing customers...');
    const contacts = readCsv(dataDir, '連絡先.csv');
    const customerIdMap = new Map<string, number>(); // Zoho Customer ID → DB id

    for (const c of contacts) {
      const zohoId   = c['Customer ID'] || c['Primary Contact ID'];
      const compName = c['Company Name'] || c['Display Name'];
      if (!compName) continue;

      // 住所を結合
      const addrParts = [c['Billing Address'], c['Billing Street2']].filter(Boolean);
      const address = addrParts.join(' ') || null;

      const existing = await prisma.customer.findFirst({ where: { companyName: compName } });
      let customerId2: number;
      if (existing) {
        customerId2 = existing.id;
      } else {
        const created = await prisma.customer.create({
          data: {
            companyName:  compName,
            contactName:  [c['First Name'], c['Last Name']].filter(Boolean).join(' ') || '',
            email:        c['EmailID'] || null,
            phone:        c['Phone'] || c['Billing Phone'] || null,
            postalCode:   c['Billing Code'] || null,
            prefecture:   c['Billing State'] || null,
            city:         c['Billing City'] || null,
            addressLine1: address,
            notes:        c['Notes'] || null,
          },
        });
        customerId2 = created.id;
      }

      if (zohoId) customerIdMap.set(zohoId, customerId2);
    }
    console.log(`  → ${customerIdMap.size} customers`);

    // ── 2. 商品マスタ ────────────────────────────────────────────────────
    console.log('Importing item masters...');
    const items = readCsv(dataDir, '商品.csv');
    let itemCount = 0;
    for (const item of items) {
      const name = item['Item Name'];
      if (!name) continue;
      try {
        await prisma.itemMaster.upsert({
          where: { name },
          create: { name },
          update: {},
        });
        itemCount++;
      } catch { /* skip */ }
    }
    console.log(`  → ${itemCount} items`);

    // ── 3. 見積書 ────────────────────────────────────────────────────────
    console.log('Importing estimates...');
    const estRows = readCsv(dataDir, '見積書.csv');

    // 見積書IDでグループ化
    const estGroups = new Map<string, typeof estRows>();
    for (const row of estRows) {
      const id = row['見積書ID'];
      if (!estGroups.has(id)) estGroups.set(id, []);
      estGroups.get(id)!.push(row);
    }

    let estCount = 0;
    for (const [, rows] of Array.from(estGroups.entries())) {
      const first = rows[0];
      const estNum  = first['見積書番号'];
      const zohoCustomerId = first['Customer ID'];
      const customerId = customerIdMap.get(zohoCustomerId);
      if (!customerId || !estNum) continue;

      const issueDate = parseDate(first['請求日']);
      if (!issueDate) continue;

      const status = ESTIMATE_STATUS[first['見積書のステータス']] ?? 'DRAFT';
      const subject = first['CF.案件名'] || first['Project Name'] || null;
      const terms   = first['CF.支払条件'] || first['Terms & Conditions'] || null;
      const notes   = first['Notes'] || null;

      const subtotal     = parseFloat2(first['SubTotal']);
      const totalAmount  = parseFloat2(first['Total']);
      const discount     = parseFloat2(first['Adjustment'] || '0');

      // 明細
      const lineItems = rows
        .filter((r: Record<string, string>) => r['Item Name'])
        .map((r: Record<string, string>, idx: number) => ({
          sortOrder:   idx,
          description: r['Item Name'],
          details:     r['Item Desc'] || null,
          quantity:    parseFloat2(r['Quantity'] || '1'),
          unit:        r['Usage unit'] || null,
          unitPrice:   parseFloat2(r['Item Price']),
          amount:      parseFloat2(r['Item Total']),
          taxRate:     parseFloat2(r['Item Tax %'] || '10'),
        }));

      const taxAmount = lineItems.reduce((sum: number, li: { amount: number; taxRate: number }) => {
        return sum + Math.round(li.amount * li.taxRate / 100);
      }, 0);

      // すでに存在する見積書はスキップ
      const exists = await prisma.estimate.findUnique({ where: { estimateNumber: estNum } });
      if (exists) continue;

      await prisma.estimate.create({
        data: {
          estimateNumber: estNum,
          customerId,
          status,
          issueDate,
          expiryDate:  parseDate(first['Expiry Date']),
          subject,
          projectName: first['Project Name'] || null,
          notes,
          terms,
          subtotal,
          taxAmount,
          discount,
          totalAmount,
          taxRate:     10,
          lineItems: {
            create: lineItems,
          },
        },
      });
      estCount++;
    }
    console.log(`  → ${estCount} estimates`);

    // ── 4. 請求書 ────────────────────────────────────────────────────────
    console.log('Importing invoices...');
    const invRows = readCsv(dataDir, '請求書.csv');

    // 請求書IDでグループ化
    const invGroups = new Map<string, typeof invRows>();
    for (const row of invRows) {
      const id = row['Invoice ID'];
      if (!invGroups.has(id)) invGroups.set(id, []);
      invGroups.get(id)!.push(row);
    }

    let invCount = 0;
    for (const [, rows] of Array.from(invGroups.entries())) {
      const first = rows[0];
      const invNum = first['Invoice Number'];
      const zohoCustomerId = first['Customer ID'];
      const customerId = customerIdMap.get(zohoCustomerId);
      if (!customerId || !invNum) continue;

      const issueDate = parseDate(first['Invoice Date']);
      if (!issueDate) continue;

      const status  = INVOICE_STATUS[first['Invoice Status']] ?? 'DRAFT';
      const subject = first['CF.案件名'] || first['Project Name'] || null;
      const terms   = first['CF.支払条件'] || first['Terms & Conditions'] || null;
      const notes   = first['Notes'] || null;

      const subtotal    = parseFloat2(first['SubTotal']);
      const totalAmount = parseFloat2(first['Total']);
      const discount    = parseFloat2(first['Entity Discount Amount'] || '0');

      // 対応する見積書IDを検索
      const estNumber  = first['Estimate Number'];
      const linkedEst  = estNumber
        ? await prisma.estimate.findUnique({ where: { estimateNumber: estNumber } })
        : null;

      const lineItems = rows
        .filter((r: Record<string, string>) => r['Item Name'])
        .map((r: Record<string, string>, idx: number) => ({
          sortOrder:   idx,
          description: r['Item Name'],
          details:     r['Item Desc'] || null,
          quantity:    parseFloat2(r['Quantity'] || '1'),
          unitPrice:   parseFloat2(r['Item Price']),
          amount:      parseFloat2(r['Item Total']),
          taxRate:     parseFloat2(r['Item Tax1 %'] || '10'),
        }));

      const taxAmount = lineItems.reduce((sum: number, li: { amount: number; taxRate: number }) => {
        return sum + Math.round(li.amount * li.taxRate / 100);
      }, 0);

      const exists = await prisma.invoice.findUnique({ where: { invoiceNumber: invNum } });
      if (exists) continue;

      await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          customerId,
          estimateId:   linkedEst?.id ?? null,
          status,
          issueDate,
          dueDate:      parseDate(first['Due Date']),
          subject,
          notes,
          terms,
          subtotal,
          taxAmount,
          discount,
          totalAmount,
          taxRate: 10,
          lineItems: {
            create: lineItems,
          },
        },
      });
      invCount++;
    }
    console.log(`  → ${invCount} invoices`);

  } finally {
    await prisma.$disconnect();
  }

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
