import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image as PdfImage,
} from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { format, parseISO } from 'date-fns';
import { Invoice } from '@/types';

// ── フォント登録 ─────────────────────────────────────────────
const _ibmReg = fs.readFileSync(path.join(process.cwd(), 'public/fonts/IBMPlexSansJP-Regular.ttf'));
const _ibmMed = fs.readFileSync(path.join(process.cwd(), 'public/fonts/IBMPlexSansJP-Medium.ttf'));
const _inter  = fs.readFileSync(path.join(process.cwd(), 'public/fonts/InterVariable.ttf'));

Font.register({
  family: 'IBMPlex',
  fonts: [
    { src: `data:font/truetype;base64,${_ibmReg.toString('base64')}`, fontWeight: 400 },
    { src: `data:font/truetype;base64,${_ibmMed.toString('base64')}`, fontWeight: 500 },
  ],
});
Font.register({ family: 'Inter', src: `data:font/truetype;base64,${_inter.toString('base64')}` });

// ── カラー ───────────────────────────────────────────────────
const C = {
  base:      '#000000',
  title:     '#817D7D',
  tableHead: '#3c3d3a',
  gray:      '#727272',
  border:    '#e3e3e3',
  totalBg:   '#eeeeee',
  white:     '#FFFFFF',
};

// ── スタイル ─────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'IBMPlex',
    fontSize: 8,
    fontWeight: 400,
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 44,
    color: C.base,
    backgroundColor: C.white,
    lineHeight: 1.6,
  },

  topRight: { position: 'absolute', top: 36, right: 40, alignItems: 'flex-end' },
  docNumber: { fontFamily: 'Inter', fontSize: 9.75, fontWeight: 500, color: C.base, textAlign: 'right' },
  docDate:   { fontFamily: 'Inter', fontSize: 9.75, color: C.gray, marginTop: 2, textAlign: 'right' },

  title: {
    fontSize: 24,
    fontWeight: 500,
    textAlign: 'center',
    color: C.title,
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 30,
  },

  twoCol:   { flexDirection: 'row', marginBottom: 18 },
  leftCol:  { flex: 1, paddingRight: 30 },
  rightCol: { width: 170 },

  toLabel:   { fontSize: 7, color: C.title, marginBottom: 3 },
  toCompany: { fontSize: 9.5, fontWeight: 500, color: C.base, marginBottom: 18 },

  cfRow:   { flexDirection: 'row', marginBottom: 5 },
  cfLabel: { width: 56, fontSize: 8, fontWeight: 400, color: C.title, lineHeight: 1.6 },
  cfColon: { width: 10, fontSize: 8, color: C.title, lineHeight: 1.6 },
  cfValue: { flex: 1, fontSize: 9.5, fontWeight: 500, color: C.base, lineHeight: 1.6 },

  companyName: { fontSize: 9.5, fontWeight: 500, color: C.base, marginBottom: 4 },
  companyLine: { fontSize: 7.5, fontWeight: 400, color: C.gray, marginBottom: 2, lineHeight: 1.5 },

  nameRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  // 自社情報欄の右端（= 印鑑枠の右端）にそろえて絶対配置（氏名の末尾に少しかぶせる・レイアウトに影響させない）
  stampImage:  { position: 'absolute', right: 0, top: 2, width: 60, height: 60, objectFit: 'contain' },

  stampArea: { flexDirection: 'row', marginTop: 8, height: 44 },
  stampBox:  { flex: 1, borderWidth: 0.75, borderColor: '#9CA3AF' },

  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: '#9CA3AF',
    paddingBottom: 7,
    paddingTop: 4,
  },
  totalBarLabel: { fontSize: 8, fontWeight: 400, color: C.gray },
  totalBarValue: { fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: C.base },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.tableHead,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeadText: { color: C.white, fontSize: 9, fontWeight: 500 },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 9,
    paddingHorizontal: 6,
    backgroundColor: C.white,
  },

  itemName:   { fontSize: 8, fontWeight: 500, color: C.base, marginBottom: 3 },
  itemDetail: { fontSize: 7, fontWeight: 400, color: C.gray, lineHeight: 1.6 },

  colDesc:  { flex: 1 },
  colQty:   { width: 38, textAlign: 'right' },
  colPrice: { width: 64, textAlign: 'right' },
  colTax:   { width: 44, textAlign: 'right' },
  colAmt:   { width: 68, textAlign: 'right' },

  totalsArea: { alignItems: 'flex-end', marginTop: 6 },
  totalLine:  { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 4 },
  totalLineLabel: {
    width: 110, textAlign: 'right', paddingRight: 12,
    color: C.gray, fontSize: 7, fontWeight: 400,
  },
  totalLineValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right', paddingRight: 6,
    fontSize: 7, color: C.base,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: C.totalBg,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  grandLabel: {
    width: 110, textAlign: 'right', paddingRight: 12,
    color: C.base, fontSize: 8, fontWeight: 500,
  },
  grandValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right',
    fontSize: 8, fontWeight: 500, color: C.base,
  },

  section:      { marginTop: 16 },
  sectionLabel: {
    fontSize: 7, fontWeight: 400, color: C.title,
    borderBottomWidth: 0.5, borderColor: C.border,
    paddingBottom: 3, marginBottom: 5,
  },
  noteBox:  { backgroundColor: '#F9FAFB', padding: 7, borderRadius: 2 },
  noteText: { fontSize: 7.5, fontWeight: 400, color: C.base, lineHeight: 1.7 },
  // 振込先: 背景なし・左揃え・14px（10.5pt）
  bankText: { fontSize: 10.5, fontWeight: 400, color: C.base, lineHeight: 1.6, textAlign: 'left' },
});

// ── ユーティリティ ───────────────────────────────────────────
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : parseISO(String(d));
    return format(date, 'yyyy/MM/dd');
  } catch { return String(d); }
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(n);
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('ja-JP').format(Math.round(n));
}

// ── コンポーネント ───────────────────────────────────────────
interface Props {
  invoice: Invoice;
  companyInfo?: {
    companyName: string; ownerName?: string | null;
    postalCode?: string | null; address?: string | null;
    phone?: string | null; registrationNumber?: string | null;
    stampImage?: string | null;
  };
}

export function InvoicePDF({ invoice, companyInfo }: Props) {
  const { customer, lineItems } = invoice;

  const subtotal   = invoice.subtotal;
  const taxAmount  = invoice.taxAmount;
  const discount   = invoice.discount ?? 0;
  const total      = invoice.totalAmount;

  const taxByRate: Record<number, number> = {};
  lineItems.forEach((i: any) => {
    const rate = i.taxRate ?? 10;
    taxByRate[rate] = (taxByRate[rate] ?? 0) + Math.round(i.amount * rate / 100);
  });
  const taxRates = Object.keys(taxByRate).map(Number).filter(r => r > 0);
  const taxLabel = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* 右上 */}
        <View style={s.topRight}>
          <Text style={s.docNumber}>{invoice.invoiceNumber}</Text>
          <Text style={s.docDate}>{fmtDate(invoice.issueDate)}</Text>
        </View>

        {/* タイトル */}
        <Text style={s.title}>請求書</Text>

        {/* ヘッダー 2カラム */}
        <View style={s.twoCol}>
          {/* 左: 請求先 + 支払期限 + 件名 */}
          <View style={s.leftCol}>
            <Text style={s.toLabel}>請求先</Text>
            <Text style={s.toCompany}>{customer?.companyName} 御中</Text>

            {invoice.dueDate ? (
              <View style={s.cfRow}>
                <Text style={s.cfLabel}>支払期限</Text>
                <Text style={s.cfColon}> :</Text>
                <Text style={s.cfValue}> {fmtDate(invoice.dueDate)}</Text>
              </View>
            ) : null}

            {invoice.subject ? (
              <View style={s.cfRow}>
                <Text style={s.cfLabel}>件名</Text>
                <Text style={s.cfColon}> :</Text>
                <Text style={s.cfValue}> {invoice.subject}</Text>
              </View>
            ) : null}

            {(invoice.customFields ?? []).map((cf, i) => (
              <View key={i} style={s.cfRow}>
                <Text style={s.cfLabel}>{cf.label}</Text>
                <Text style={s.cfColon}> :</Text>
                <Text style={s.cfValue}> {cf.value}</Text>
              </View>
            ))}
          </View>

          {/* 右: 自社情報 + 印鑑 */}
          <View style={s.rightCol}>
            {companyInfo?.companyName ? (
              <>
                <View style={s.nameRow}>
                  <Text style={[s.companyName, { flexShrink: 1 }]}>
                    {companyInfo.companyName}{companyInfo.ownerName ? `　${companyInfo.ownerName}` : ''}
                  </Text>
                  {companyInfo.stampImage ? (
                    <PdfImage src={companyInfo.stampImage} style={s.stampImage} />
                  ) : null}
                </View>
                {companyInfo.postalCode && <Text style={s.companyLine}>{companyInfo.postalCode}</Text>}
                {companyInfo.address    && <Text style={s.companyLine}>{companyInfo.address}</Text>}
                {companyInfo.phone      && <Text style={s.companyLine}>電話番号 : {companyInfo.phone}</Text>}
                {companyInfo.registrationNumber && (
                  <Text style={s.companyLine}>登録番号 : {companyInfo.registrationNumber}</Text>
                )}
              </>
            ) : null}
            <View style={s.stampArea}>
              <View style={s.stampBox} />
              <View style={s.stampBox} />
              <View style={s.stampBox} />
            </View>
          </View>
        </View>

        {/* 総額バー */}
        <View style={[s.twoCol, { marginBottom: 30 }]}>
          <View style={s.leftCol}>
            <View style={s.totalBar}>
              <Text style={s.totalBarLabel}>総額</Text>
              <Text style={s.totalBarValue}>¥{fmtNum(total)}</Text>
            </View>
          </View>
          <View style={s.rightCol} />
        </View>

        {/* 明細テーブル */}
        <View>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadText, s.colDesc]}>項目 &amp; 詳細</Text>
            <Text style={[s.tableHeadText, s.colQty]}>数量</Text>
            <Text style={[s.tableHeadText, s.colPrice]}>単価</Text>
            <Text style={[s.tableHeadText, s.colTax]}>税(%)</Text>
            <Text style={[s.tableHeadText, s.colAmt]}>総額</Text>
          </View>

          {lineItems.map((item: any, i: number) => (
            <View key={i} style={s.tableRow}>
              <View style={s.colDesc}>
                <Text style={s.itemName}>{item.description}</Text>
                {item.details ? (
                  <Text style={s.itemDetail}>{item.details}</Text>
                ) : null}
              </View>
              <Text style={[s.colQty,   { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{fmtQty(item.quantity)}</Text>
              <Text style={[s.colPrice, { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{fmtNum(item.unitPrice)}</Text>
              <Text style={[s.colTax,   { fontFamily: 'Inter', fontSize: 8, color: C.gray }]}>
                {(item.taxRate ?? 10) === 0 ? '-' : `${item.taxRate ?? 10}`}
              </Text>
              <Text style={[s.colAmt,   { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{fmtNum(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 集計 */}
        <View style={s.totalsArea}>
          <View style={s.totalLine}>
            <Text style={s.totalLineLabel}>小計</Text>
            <Text style={s.totalLineValue}>{fmtNum(subtotal)}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={s.totalLineLabel}>{taxLabel}</Text>
            <Text style={s.totalLineValue}>{fmtNum(taxAmount)}</Text>
          </View>
          {discount > 0 && (
            <View style={s.totalLine}>
              <Text style={s.totalLineLabel}>値引き</Text>
              <Text style={s.totalLineValue}>(-) {fmtNum(discount)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandLabel}>総額</Text>
            <Text style={s.grandValue}>¥{fmtNum(total)}</Text>
          </View>
        </View>

        {invoice.bankInfo && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>振込先</Text>
            <Text style={s.bankText}>{invoice.bankInfo}</Text>
          </View>
        )}
        {invoice.notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>備考</Text>
            <View style={s.noteBox}><Text style={s.noteText}>{invoice.notes}</Text></View>
          </View>
        )}
        {invoice.terms && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>取引条件</Text>
            <Text style={s.noteText}>{invoice.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
