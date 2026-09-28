import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { format, parseISO } from 'date-fns';
import { Estimate } from '@/types';

// ── フォント登録 ─────────────────────────────────────────────
const _zenReg  = fs.readFileSync(path.join(process.cwd(), 'public/fonts/ZenKakuGothicNew-Regular.ttf'));
const _zenBold = fs.readFileSync(path.join(process.cwd(), 'public/fonts/ZenKakuGothicNew-Bold.ttf'));
const _inter   = fs.readFileSync(path.join(process.cwd(), 'public/fonts/InterVariable.ttf'));

Font.register({
  family: 'ZenKaku',
  fonts: [
    { src: `data:font/truetype;base64,${_zenReg.toString('base64')}`,  fontWeight: 'normal' },
    { src: `data:font/truetype;base64,${_zenBold.toString('base64')}`, fontWeight: 'bold' },
  ],
});
Font.register({ family: 'Inter', src: `data:font/truetype;base64,${_inter.toString('base64')}` });

// ── カラー（仕様準拠） ────────────────────────────────────────
const C = {
  base:       '#000000',   // 基本フォントカラー
  title:      '#817D7D',   // タイトル・見出しカラー
  mid:        '#3c3d3a',   // 表ヘッダー背景
  gray:       '#727272',   // 注釈・サブテキスト
  border:     '#e3e3e3',   // 表の罫線
  veryLight:  '#F9FAFB',   // 交互行背景
  white:      '#FFFFFF',
};

// ── スタイル ─────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'ZenKaku',
    fontSize: 8,
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 44,
    color: C.base,
    backgroundColor: C.white,
    lineHeight: 1.6,
  },

  // 右上: 見積番号・日付
  topRight: { position: 'absolute', top: 36, right: 40, textAlign: 'right' },
  docNumber: { fontFamily: 'Inter', fontSize: 9, fontWeight: 'bold', color: C.base },
  docDate:   { fontFamily: 'Inter', fontSize: 7.5, color: C.gray, marginTop: 2 },

  // タイトル
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: C.title,
    marginTop: 4,
    marginBottom: 18,
  },

  // ヘッダー 2カラム
  headerRow:   { flexDirection: 'row', marginBottom: 18 },
  headerLeft:  { flex: 1, paddingRight: 20 },
  headerRight: { width: 200 },

  // 送付先
  toLabel:   { fontSize: 7, color: C.title, marginBottom: 3 },
  toCompany: { fontSize: 13, fontWeight: 'bold', color: C.base, marginBottom: 10 },

  // 件名（送付先直下）
  subjectRow:   { flexDirection: 'row', marginBottom: 3 },
  subjectLabel: { fontSize: 7.5, color: C.title },
  subjectValue: { fontSize: 7.5, color: C.base, marginLeft: 4 },

  // カスタムフィールド行
  cfRow:   { flexDirection: 'row', marginBottom: 5 },
  cfLabel: { width: 56, fontSize: 8, color: C.title, lineHeight: 1.6 },
  cfColon: { width: 10, fontSize: 8, color: C.title, lineHeight: 1.6 },
  cfValue: { flex: 1, fontSize: 8, fontWeight: 'bold', color: C.base, lineHeight: 1.6 },

  // 自社情報
  companyName: { fontSize: 9.5, fontWeight: 'bold', color: C.base, marginBottom: 4 },
  companyLine: { fontSize: 7.5, color: C.gray, marginBottom: 2, lineHeight: 1.5 },

  // 印鑑枠 3マス
  stampArea: { flexDirection: 'row', marginTop: 10, height: 46 },
  stampBox:  { flex: 1, borderWidth: 0.75, borderColor: '#9CA3AF' },

  // 総額バー
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#9CA3AF',
    paddingVertical: 7,
    marginBottom: 22,
  },
  totalBarLabel: { fontSize: 10, color: C.gray },
  totalBarValue: { fontFamily: 'Inter', fontSize: 15, fontWeight: 'bold', color: C.base },

  // 明細テーブル
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.mid,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeadText: { color: C.white, fontSize: 9, fontWeight: 'bold' },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: C.border,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: C.veryLight },

  itemName:   { fontSize: 8, fontWeight: 'bold', color: C.base, marginBottom: 3 },
  itemDetail: { fontSize: 7, color: C.gray, lineHeight: 1.6 },

  // 列幅（単位列なし）
  colDesc:  { flex: 1 },
  colQty:   { width: 38, textAlign: 'right' },
  colPrice: { width: 64, textAlign: 'right' },
  colTax:   { width: 44, textAlign: 'right' },
  colAmt:   { width: 68, textAlign: 'right' },

  // 集計
  totalsArea: { alignItems: 'flex-end', marginTop: 6 },
  totalLine:  { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 3.5 },
  totalLineLabel: {
    width: 110, textAlign: 'right', paddingRight: 12,
    color: C.gray, fontSize: 8,
  },
  totalLineValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right',
    fontSize: 8, color: C.base,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: C.mid,
    paddingVertical: 7,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  grandLabel: {
    width: 110, textAlign: 'right', paddingRight: 12,
    color: C.white, fontSize: 9, fontWeight: 'bold',
  },
  grandValue: {
    fontFamily: 'Inter', width: 80, textAlign: 'right',
    fontSize: 9, fontWeight: 'bold', color: C.white,
  },

  // 備考・取引条件
  section:      { marginTop: 16 },
  sectionLabel: {
    fontSize: 7, color: C.title,
    borderBottomWidth: 0.5, borderColor: C.border,
    paddingBottom: 3, marginBottom: 5,
  },
  noteBox:  { backgroundColor: C.veryLight, padding: 7, borderRadius: 2 },
  noteText: { fontSize: 7.5, color: C.base, lineHeight: 1.7 },
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

  const taxRates = Object.keys(taxByRate).map(Number).filter(r => r > 0);
  const taxLabel = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* 右上: 見積番号・日付 */}
        <View style={s.topRight}>
          <Text style={s.docNumber}>{estimate.estimateNumber}</Text>
          <Text style={s.docDate}>{fmtDate(estimate.issueDate)}</Text>
        </View>

        {/* タイトル */}
        <Text style={s.title}>見積書</Text>

        {/* ヘッダー 2カラム */}
        <View style={s.headerRow}>

          {/* 左: 送付先 + 件名 + カスタムフィールド */}
          <View style={s.headerLeft}>
            <Text style={s.toLabel}>送付先</Text>
            <Text style={s.toCompany}>{customer?.companyName} 御中</Text>

            {estimate.subject ? (
              <View style={[s.cfRow, { marginBottom: 8 }]}>
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

          {/* 右: 自社情報 + 印鑑枠 */}
          <View style={s.headerRight}>
            {companyInfo?.companyName ? (
              <>
                <Text style={s.companyName}>
                  {companyInfo.companyName}{companyInfo.ownerName ? `　${companyInfo.ownerName}` : ''}
                </Text>
                {companyInfo.postalCode && (
                  <Text style={s.companyLine}>{companyInfo.postalCode}</Text>
                )}
                {companyInfo.address && (
                  <Text style={s.companyLine}>{companyInfo.address}</Text>
                )}
                {companyInfo.phone && (
                  <Text style={s.companyLine}>電話番号 : {companyInfo.phone}</Text>
                )}
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
        <View style={s.totalBar}>
          <Text style={s.totalBarLabel}>総額</Text>
          <Text style={s.totalBarValue}>¥{fmtNum(total)}</Text>
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
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
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

        {/* 備考 */}
        {estimate.notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>備考</Text>
            <View style={s.noteBox}>
              <Text style={s.noteText}>{estimate.notes}</Text>
            </View>
          </View>
        )}

        {/* 取引条件 */}
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
