import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image as PdfImage,
} from '@react-pdf/renderer';
import path from 'path';
import { DOC_FONT as F } from '@/lib/doc-fonts';
import fs from 'fs';
import { format, parseISO } from 'date-fns';
import { OrderAcceptance, DeliveryNote, LineItem } from '@/types';

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
  docNumber: { fontFamily: 'Inter', fontSize: F.docNumber, fontWeight: 500, color: C.base, textAlign: 'right' },
  docDate:   { fontSize: F.docNumber, color: C.gray, marginTop: 2, textAlign: 'right' },

  title: {
    fontSize: F.title,
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

  toLabel:   { fontSize: F.toLabel, color: C.title, marginBottom: 3 },
  toCompany: { fontSize: F.toCompany, fontWeight: 500, color: C.base, marginBottom: 18 },
  lead:      { fontSize: F.lead, color: C.base, marginBottom: 12 },

  cfRow:   { flexDirection: 'row', marginBottom: 5 },
  cfLabel: { width: 56, fontSize: F.infoLabel, fontWeight: 400, color: C.title, lineHeight: 1.6 },
  cfColon: { width: 10, fontSize: F.infoLabel, color: C.title, lineHeight: 1.6 },
  cfValue: { flex: 1, fontSize: F.infoValue, fontWeight: 500, color: C.base, lineHeight: 1.6 },

  companyName: { fontSize: F.companyName, fontWeight: 500, color: C.base, marginBottom: 4 },
  companyLine: { fontSize: F.companyLine, fontWeight: 400, color: C.gray, marginBottom: 2, lineHeight: 1.5 },

  nameRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  // 自社情報欄の右端（= 印鑑枠の右端）にそろえて絶対配置（氏名の末尾に少しかぶせる・レイアウトに影響させない）
  // 自社情報より先に描画してテキストの背面に置く
  stampImage:  { position: 'absolute', right: 0, top: 12, width: 48, height: 48, objectFit: 'contain' },

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
  totalBarLabel: { fontSize: F.totalBarLabel, fontWeight: 400, color: C.gray },
  totalBarValue: { fontFamily: 'Inter', fontSize: F.totalBarValue, fontWeight: 500, color: C.base },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.tableHead,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeadText: { color: C.white, fontSize: F.tableHead, fontWeight: 500 },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 9,
    paddingHorizontal: 6,
    backgroundColor: C.white,
  },

  itemName:   { fontSize: F.itemName, fontWeight: 500, color: C.base, marginBottom: 3 },
  itemDetail: { fontSize: F.itemDetail, fontWeight: 400, color: C.gray, lineHeight: 1.6 },

  colDesc:  { flex: 1 },
  colQty:   { width: 38, textAlign: 'right' },
  colPrice: { width: 72, textAlign: 'right' },
  colAmt:   { width: 80, textAlign: 'right' },

  totalsArea: { alignItems: 'flex-end', marginTop: 6 },
  totalLine:  { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 4 },
  totalLineLabel: {
    width: 110, textAlign: 'right', paddingRight: 12,
    color: C.gray, fontSize: F.totalLabel, fontWeight: 400,
  },
  totalLineValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right', paddingRight: 6,
    fontSize: F.totalValue, color: C.base,
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
    color: C.base, fontSize: F.totalLabel, fontWeight: 500,
  },
  grandValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right',
    fontSize: F.grandValue, fontWeight: 500, color: C.base,
  },

  section:      { marginTop: 16 },
  sectionLabel: {
    fontSize: F.sectionLabel, fontWeight: 400, color: C.title,
    marginBottom: 4,
  },
  noteText: { fontSize: F.noteText, fontWeight: 400, color: C.base, lineHeight: 1.7 },
});

// ── ユーティリティ ───────────────────────────────────────────
export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : parseISO(String(d));
    return format(date, 'yyyy年M月d日');
  } catch { return String(d); }
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(n);
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('ja-JP').format(Math.round(n));
}

// ── コンポーネント ───────────────────────────────────────────
// 発注請書・納品書で共通のレイアウト（文言・項目だけ差し替える）
type CompanyInfo = {
  companyName: string; ownerName?: string | null;
  postalCode?: string | null; address?: string | null;
  phone?: string | null; registrationNumber?: string | null;
  stampImage?: string | null;
};

export interface SimpleDocProps {
  title: string;
  docNumber: string;
  date: Date | string;
  customerName?: string;
  lead: string;
  infoRows: { label: string; value?: string | null }[];
  totalLabel: string;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string | null;
  companyInfo?: CompanyInfo;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={s.cfRow}>
      <Text style={s.cfLabel}>{label}</Text>
      <Text style={s.cfColon}> :</Text>
      <Text style={s.cfValue}> {value}</Text>
    </View>
  );
}

export function SimpleDocPDF({
  title, docNumber, date, customerName, lead, infoRows, totalLabel,
  lineItems, subtotal, taxAmount, discount, total, notes, companyInfo,
}: SimpleDocProps) {
  const taxRates = Array.from(new Set(lineItems.map(i => i.taxRate ?? 10))).filter(r => r > 0);
  const taxLabel = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* 右上 */}
        <View style={s.topRight}>
          <Text style={s.docNumber}>{docNumber}</Text>
          <Text style={s.docDate}>{fmtDate(date)}</Text>
        </View>

        {/* タイトル */}
        <Text style={s.title}>{title}</Text>

        {/* ヘッダー 2カラム */}
        <View style={s.twoCol}>
          {/* 左: 宛先 + 文言 + 案件情報 */}
          <View style={s.leftCol}>
            <Text style={s.toLabel}>送付先</Text>
            <Text style={s.toCompany}>{customerName} 御中</Text>
            <Text style={s.lead}>{lead}</Text>

            {infoRows.map((row, i) => (
              <InfoRow key={i} label={row.label} value={row.value} />
            ))}
          </View>

          {/* 右: 自社情報 + 印鑑 */}
          <View style={s.rightCol}>
            {companyInfo?.stampImage ? (
              <PdfImage src={companyInfo.stampImage} style={s.stampImage} />
            ) : null}
            {companyInfo?.companyName ? (
              <>
                <View style={s.nameRow}>
                  <Text style={[s.companyName, { flexShrink: 1 }]}>
                    {companyInfo.companyName}{companyInfo.ownerName ? `　${companyInfo.ownerName}` : ''}
                  </Text>
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

        {/* 金額バー */}
        <View style={[s.twoCol, { marginBottom: 30 }]}>
          <View style={s.leftCol}>
            <View style={s.totalBar}>
              <Text style={s.totalBarLabel}>{totalLabel}</Text>
              <Text style={s.totalBarValue}>¥{fmtNum(total)}</Text>
            </View>
          </View>
          <View style={s.rightCol} />
        </View>

        {/* 明細テーブル */}
        <View>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadText, s.colDesc]}>納品物 &amp; 詳細</Text>
            <Text style={[s.tableHeadText, s.colQty]}>数量</Text>
            <Text style={[s.tableHeadText, s.colPrice]}>単価</Text>
            <Text style={[s.tableHeadText, s.colAmt]}>総額</Text>
          </View>

          {lineItems.map((item, i) => (
            <View key={i} style={s.tableRow} wrap={false}>
              <View style={s.colDesc}>
                <Text style={s.itemName}>{item.description}</Text>
                {item.details ? <Text style={s.itemDetail}>{item.details}</Text> : null}
              </View>
              <Text style={[s.colQty,   { fontFamily: 'Inter', fontSize: F.cell, color: C.base }]}>{fmtQty(item.quantity)}</Text>
              <Text style={[s.colPrice, { fontFamily: 'Inter', fontSize: F.cell, color: C.base }]}>{fmtNum(item.unitPrice)}</Text>
              <Text style={[s.colAmt,   { fontFamily: 'Inter', fontSize: F.cell, color: C.base }]}>{fmtNum(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* 集計 */}
        <View style={s.totalsArea} wrap={false}>
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

        {notes ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>備考</Text>
            <Text style={s.noteText}>{notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export function OrderAcceptancePDF({ order, companyInfo }: { order: OrderAcceptance; companyInfo?: CompanyInfo }) {
  return (
    <SimpleDocPDF
      title="発注請書"
      docNumber={order.orderNumber}
      date={order.orderDate}
      customerName={order.customer?.companyName}
      lead="下記の通り発注を承りました。"
      infoRows={[
        { label: '案件名', value: order.subject },
        { label: '納期', value: fmtDate(order.deliveryDate) },
        { label: '納入場所', value: order.deliveryPlace },
        { label: '支払条件', value: order.paymentTerms },
        ...(order.customFields ?? []).map(cf => ({ label: cf.label, value: cf.value })),
      ]}
      totalLabel="発注金額"
      lineItems={order.lineItems}
      subtotal={order.subtotal}
      taxAmount={order.taxAmount}
      discount={order.discount ?? 0}
      total={order.totalAmount}
      notes={order.notes}
      companyInfo={companyInfo}
    />
  );
}

export function DeliveryNotePDF({ note, companyInfo }: { note: DeliveryNote; companyInfo?: CompanyInfo }) {
  return (
    <SimpleDocPDF
      title="納品書"
      docNumber={note.deliveryNumber}
      date={note.deliveryDate}
      customerName={note.customer?.companyName}
      lead="下記の通り納品致します。"
      infoRows={[
        { label: '案件名', value: note.subject },
        { label: '納品日', value: fmtDate(note.deliveryDate) },
        { label: '納入形式', value: note.deliveryFormat },
        ...(note.customFields ?? []).map(cf => ({ label: cf.label, value: cf.value })),
      ]}
      totalLabel="納品金額"
      lineItems={note.lineItems}
      subtotal={note.subtotal}
      taxAmount={note.taxAmount}
      discount={note.discount ?? 0}
      total={note.totalAmount}
      notes={note.notes}
      companyInfo={companyInfo}
    />
  );
}
