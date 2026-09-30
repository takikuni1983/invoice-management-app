import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image as PdfImage,
} from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { format, parseISO } from 'date-fns';
import { OrderAcceptance } from '@/types';

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

  topRight: { position: 'absolute', top: 36, right: 40, textAlign: 'right' },
  docNumber: { fontFamily: 'Inter', fontSize: 9.75, fontWeight: 500, color: C.base },
  docDate:   { fontSize: 9.75, color: C.gray, marginTop: 2 },

  title: {
    fontSize: 24,
    fontWeight: 500,
    textAlign: 'center',
    color: C.title,
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 18,
  },

  twoCol:   { flexDirection: 'row', marginBottom: 18 },
  leftCol:  { flex: 1, paddingRight: 30 },
  rightCol: { width: 170 },

  toCompany: { fontSize: 8.5, fontWeight: 500, color: C.base, marginBottom: 18 },
  lead:      { fontSize: 8, color: C.base, marginBottom: 12 },

  cfRow:   { flexDirection: 'row', marginBottom: 5 },
  cfLabel: { width: 56, fontSize: 8, fontWeight: 400, color: C.title, lineHeight: 1.6 },
  cfColon: { width: 10, fontSize: 8, color: C.title, lineHeight: 1.6 },
  cfValue: { flex: 1, fontSize: 8.5, fontWeight: 500, color: C.base, lineHeight: 1.6 },

  companyName: { fontSize: 9.5, fontWeight: 500, color: C.base, marginBottom: 4 },
  companyLine: { fontSize: 7.5, fontWeight: 400, color: C.gray, marginBottom: 2, lineHeight: 1.5 },

  nameRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  // 幅0の基準点から絶対配置し、レイアウトに影響させない
  stampAnchor: { width: 0, height: 0 },
  stampImage:  { position: 'absolute', left: -6, top: -12, width: 40, height: 40, objectFit: 'contain' },

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
  colPrice: { width: 72, textAlign: 'right' },
  colAmt:   { width: 80, textAlign: 'right' },

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
});

// ── ユーティリティ ───────────────────────────────────────────
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : parseISO(String(d));
    return format(date, 'yyyy年M月d日');
  } catch { return String(d); }
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('ja-JP').format(Math.round(n));
}

// ── コンポーネント ───────────────────────────────────────────
interface Props {
  order: OrderAcceptance;
  companyInfo?: {
    companyName: string; ownerName?: string | null;
    postalCode?: string | null; address?: string | null;
    phone?: string | null; registrationNumber?: string | null;
    stampImage?: string | null;
  };
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

export function OrderAcceptancePDF({ order, companyInfo }: Props) {
  const { customer, lineItems, customFields = [] } = order;

  const subtotal  = order.subtotal;
  const taxAmount = order.taxAmount;
  const discount  = order.discount ?? 0;
  const total     = order.totalAmount;

  const taxRates = Array.from(new Set(lineItems.map(i => i.taxRate ?? 10))).filter(r => r > 0);
  const taxLabel = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* 右上 */}
        <View style={s.topRight}>
          <Text style={s.docNumber}>{order.orderNumber}</Text>
          <Text style={s.docDate}>発注日 : {fmtDate(order.orderDate)}</Text>
        </View>

        {/* タイトル */}
        <Text style={s.title}>発注請書</Text>

        {/* ヘッダー 2カラム */}
        <View style={s.twoCol}>
          {/* 左: 発注元 + 文言 + 案件情報 */}
          <View style={s.leftCol}>
            <Text style={s.toCompany}>{customer?.companyName} 御中</Text>
            <Text style={s.lead}>下記の通り発注を承りました。</Text>

            <InfoRow label="案件名" value={order.subject} />
            <InfoRow label="納期" value={fmtDate(order.deliveryDate)} />
            <InfoRow label="納入場所" value={order.deliveryPlace} />
            <InfoRow label="支払条件" value={order.paymentTerms} />
            {customFields.map((cf, i) => (
              <InfoRow key={i} label={cf.label} value={cf.value} />
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
                    <View style={s.stampAnchor}>
                      <PdfImage src={companyInfo.stampImage} style={s.stampImage} />
                    </View>
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

        {/* 発注金額バー */}
        <View style={[s.twoCol, { marginBottom: 30 }]}>
          <View style={s.leftCol}>
            <View style={s.totalBar}>
              <Text style={s.totalBarLabel}>発注金額</Text>
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
              <Text style={[s.colQty,   { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{item.quantity}</Text>
              <Text style={[s.colPrice, { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{fmtNum(item.unitPrice)}</Text>
              <Text style={[s.colAmt,   { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{fmtNum(item.amount)}</Text>
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

        {order.notes ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>備考</Text>
            <View style={s.noteBox}><Text style={s.noteText}>{order.notes}</Text></View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
