import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { format, parseISO } from 'date-fns';
import { Estimate } from '@/types';

// ── フォント登録 ─────────────────────────────────────────────
const _ibmReg  = fs.readFileSync(path.join(process.cwd(), 'public/fonts/IBMPlexSansJP-Regular.ttf'));
const _ibmMed  = fs.readFileSync(path.join(process.cwd(), 'public/fonts/IBMPlexSansJP-Medium.ttf'));
const _inter   = fs.readFileSync(path.join(process.cwd(), 'public/fonts/InterVariable.ttf'));

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
  docNumber: { fontFamily: 'Inter', fontSize: 9, fontWeight: 500, color: C.base },
  docDate:   { fontFamily: 'Inter', fontSize: 7.5, color: C.gray, marginTop: 2 },

  title: {
    fontSize: 24,
    fontWeight: 500,
    textAlign: 'center',
    color: C.title,
    marginTop: 4,
    marginBottom: 18,
  },

  // ヘッダー 2カラム（총額バーも同じ幅制御に使用）
  twoCol:      { flexDirection: 'row', marginBottom: 18 },
  leftCol:     { flex: 1, paddingRight: 20 },
  rightCol:    { width: 200 },

  toLabel:   { fontSize: 7, color: C.title, marginBottom: 3 },
  toCompany: { fontSize: 13, fontWeight: 500, color: C.base, marginBottom: 10 },

  cfRow:   { flexDirection: 'row', marginBottom: 5 },
  cfLabel: { width: 56, fontSize: 8, fontWeight: 400, color: C.title, lineHeight: 1.6 },
  cfColon: { width: 10, fontSize: 8, color: C.title, lineHeight: 1.6 },
  cfValue: { flex: 1, fontSize: 8, fontWeight: 500, color: C.base, lineHeight: 1.6 },

  companyName: { fontSize: 9.5, fontWeight: 500, color: C.base, marginBottom: 4 },
  companyLine: { fontSize: 7.5, fontWeight: 400, color: C.gray, marginBottom: 2, lineHeight: 1.5 },

  stampArea: { flexDirection: 'row', marginTop: 10, height: 46 },
  stampBox:  { flex: 1, borderWidth: 0.75, borderColor: '#9CA3AF' },

  // 総額バー: 下線のみ・左カラムに収まる
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: '#9CA3AF',
    paddingBottom: 7,
    paddingTop: 4,
  },
  totalBarLabel: { fontSize: 10, fontWeight: 400, color: C.gray },
  totalBarValue: { fontFamily: 'Inter', fontSize: 15, fontWeight: 500, color: C.base },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.tableHead,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeadText: { color: C.white, fontSize: 9, fontWeight: 500 },

  // 行は全て白
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
    color: C.gray, fontSize: 8, fontWeight: 400,
  },
  totalLineValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right', paddingRight: 6,
    fontSize: 8, color: C.base,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: C.totalBg,
    paddingVertical: 7,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  grandLabel: {
    width: 110, textAlign: 'right', paddingRight: 12,
    color: C.base, fontSize: 9, fontWeight: 500,
  },
  grandValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right',
    fontSize: 9, fontWeight: 500, color: C.base,
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
    return format(date, 'yyyy/MM/dd');
  } catch { return String(d); }
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('ja-JP').format(Math.round(n));
}

// ── コンポーネント ───────────────────────────────────────────
interface Props {
  estimate: Estimate & {
    customFields?: { label: string; value: string }[];
  };
  companyInfo?: {
    companyName: string; ownerName?: string | null;
    postalCode?: string | null; address?: string | null;
    phone?: string | null; registrationNumber?: string | null;
  };
}

export function EstimatePDF({ estimate, companyInfo }: Props) {
  const { customer, lineItems, customFields = [] } = estimate;

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const taxByRate: Record<number, number> = {};
  lineItems.forEach(i => {
    const rate = i.taxRate ?? 10;
    taxByRate[rate] = (taxByRate[rate] ?? 0) + Math.round(i.amount * rate / 100);
  });
  const taxAmount = Object.values(taxByRate).reduce((a, b) => a + b, 0);
  const discount  = estimate.discount ?? 0;
  const total     = subtotal + taxAmount - discount;
  const taxRates  = Object.keys(taxByRate).map(Number).filter(r => r > 0);
  const taxLabel  = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* 右上 */}
        <View style={s.topRight}>
          <Text style={s.docNumber}>{estimate.estimateNumber}</Text>
          <Text style={s.docDate}>{fmtDate(estimate.issueDate)}</Text>
        </View>

        {/* タイトル */}
        <Text style={s.title}>見積書</Text>

        {/* ヘッダー 2カラム */}
        <View style={s.twoCol}>
          {/* 左: 送付先 + 有効期限 + 件名 + カスタムフィールド */}
          <View style={s.leftCol}>
            <Text style={s.toLabel}>送付先</Text>
            <Text style={s.toCompany}>{customer?.companyName} 御中</Text>

            {estimate.expiryDate ? (
              <View style={s.cfRow}>
                <Text style={s.cfLabel}>有効期限</Text>
                <Text style={s.cfColon}> :</Text>
                <Text style={s.cfValue}> {fmtDate(estimate.expiryDate)}</Text>
              </View>
            ) : null}

            {estimate.subject ? (
              <View style={s.cfRow}>
                <Text style={s.cfLabel}>件名</Text>
                <Text style={s.cfColon}> :</Text>
                <Text style={s.cfValue}> {estimate.subject}</Text>
              </View>
            ) : null}

            {customFields.map((cf, i) => (
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
                <Text style={s.companyName}>
                  {companyInfo.companyName}{companyInfo.ownerName ? `　${companyInfo.ownerName}` : ''}
                </Text>
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

        {/* 総額バー: 左カラムと同じ幅 */}
        <View style={[s.twoCol, { marginBottom: 22 }]}>
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

          {lineItems.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <View style={s.colDesc}>
                <Text style={s.itemName}>{item.description}</Text>
                {(item as any).details ? (
                  <Text style={s.itemDetail}>{(item as any).details}</Text>
                ) : null}
              </View>
              <Text style={[s.colQty,   { fontFamily: 'Inter', fontSize: 8, color: C.base }]}>{item.quantity}</Text>
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

        {estimate.notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>備考</Text>
            <View style={s.noteBox}><Text style={s.noteText}>{estimate.notes}</Text></View>
          </View>
        )}
        {estimate.terms && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>取引条件</Text>
            <Text style={s.noteText}>{estimate.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
