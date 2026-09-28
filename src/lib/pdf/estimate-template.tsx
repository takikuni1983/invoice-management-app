import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Estimate } from '@/types';

// ── フォント登録 ──────────────────────────────────────────
const _ipaBuf = fs.readFileSync(path.join(process.cwd(), 'public/fonts/IPAPGothic.ttf'));
const _ipaSrc = `data:font/truetype;base64,${_ipaBuf.toString('base64')}`;
Font.register({ family: 'IPAPGothic', src: _ipaSrc });

const _interBuf = fs.readFileSync(path.join(process.cwd(), 'public/fonts/InterVariable.ttf'));
const _interSrc = `data:font/truetype;base64,${_interBuf.toString('base64')}`;
Font.register({ family: 'Inter', src: _interSrc });

// ── カラー ────────────────────────────────────────────────
const C = {
  dark: '#1F2937',
  mid: '#374151',
  gray: '#6B7280',
  lightGray: '#D1D5DB',
  veryLight: '#F3F4F6',
  white: '#FFFFFF',
  black: '#111827',
};

// ── スタイル ──────────────────────────────────────────────
const s = StyleSheet.create({
  page: { fontFamily: 'IPAPGothic', fontSize: 8.5, padding: 36, color: C.black, backgroundColor: C.white },

  // トップ右: 見積番号・日付
  topRight: { position: 'absolute', top: 36, right: 36, textAlign: 'right' },
  docNumber: { fontFamily: 'Inter', fontSize: 9, fontWeight: 'bold', color: C.black },
  docDate: { fontFamily: 'Inter', fontSize: 8, color: C.gray, marginTop: 2 },

  // タイトル
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: C.black, marginBottom: 18, marginTop: 4 },

  // ヘッダー 2カラム
  headerRow: { flexDirection: 'row', marginBottom: 16 },
  headerLeft: { flex: 1, paddingRight: 16 },
  headerRight: { width: 200 },

  // 送付先
  toLabel: { fontSize: 7, color: C.gray, marginBottom: 3 },
  toCompany: { fontSize: 13, fontWeight: 'bold', color: C.black, marginBottom: 10 },

  // カスタムフィールド
  cfRow: { flexDirection: 'row', marginBottom: 5 },
  cfLabel: { width: 64, fontSize: 8, color: C.gray },
  cfColon: { width: 10, fontSize: 8, color: C.gray },
  cfValue: { flex: 1, fontSize: 8, color: C.black, fontWeight: 'bold' },

  // 自社情報
  companyName: { fontSize: 9.5, fontWeight: 'bold', color: C.black, marginBottom: 3 },
  companyLine: { fontSize: 7.5, color: C.gray, marginBottom: 1.5 },

  // 印鑑枠
  stampArea: { flexDirection: 'row', marginTop: 10, height: 44 },
  stampBox: { flex: 1, border: '1px solid #9CA3AF' },

  // 総額バー
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1.5px solid ' + C.mid, borderBottom: '1.5px solid ' + C.mid,
    paddingTop: 6, paddingBottom: 6, marginBottom: 20 },
  totalBarLabel: { fontSize: 10, color: C.gray },
  totalBarValue: { fontFamily: 'Inter', fontSize: 14, fontWeight: 'bold', color: C.black },

  // 明細テーブル
  table: { marginBottom: 0 },
  tableHead: { flexDirection: 'row', backgroundColor: C.mid, paddingVertical: 5, paddingHorizontal: 4 },
  tableHeadText: { color: C.white, fontSize: 7.5, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottom: '0.5px solid ' + C.lightGray, paddingVertical: 5, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: C.veryLight },
  itemName: { fontSize: 8, fontWeight: 'bold', color: C.black, marginBottom: 1 },
  itemDetail: { fontSize: 7, color: C.gray },

  // 列幅
  colDesc: { flex: 1 },
  colQty:  { width: 36, textAlign: 'right' },
  colUnit: { width: 28, textAlign: 'center' },
  colPrice:{ width: 60, textAlign: 'right' },
  colTax:  { width: 36, textAlign: 'right' },
  colAmt:  { width: 64, textAlign: 'right' },

  // 集計
  totalsArea: { alignItems: 'flex-end', marginTop: 4 },
  totalLine: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 2.5 },
  totalLineLabel: { width: 100, textAlign: 'right', paddingRight: 10, color: C.gray, fontSize: 8 },
  totalLineValue: { fontFamily: 'Inter', width: 80, textAlign: 'right', fontSize: 8, color: C.black },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'flex-end',
    backgroundColor: C.mid, paddingVertical: 5, marginTop: 3 },
  grandLabel: { width: 100, textAlign: 'right', paddingRight: 10, color: C.white, fontSize: 9, fontWeight: 'bold' },
  grandValue: { fontFamily: 'Inter', width: 80, textAlign: 'right', fontSize: 9, fontWeight: 'bold', color: C.white },

  // 備考
  section: { marginTop: 14 },
  sectionLabel: { fontSize: 7, color: C.gray, borderBottom: '0.5px solid ' + C.lightGray, paddingBottom: 2, marginBottom: 4 },
  noteBox: { backgroundColor: C.veryLight, padding: 6, borderRadius: 2 },
});

// ── ユーティリティ ────────────────────────────────────────
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '';
  try {
    const date = d instanceof Date ? d : parseISO(String(d));
    return format(date, 'yyyy/MM/dd');
  } catch { return String(d); }
}
function fmtNum(n: number) { return new Intl.NumberFormat('ja-JP').format(Math.round(n)); }

// ── コンポーネント ────────────────────────────────────────
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
  const taxAmount = lineItems.reduce((s, i) => s + Math.round(i.amount * (i.taxRate ?? 10) / 100), 0);
  const discount = estimate.discount ?? 0;
  const total = subtotal + taxAmount - discount;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* 見積番号・日付（右上） */}
        <View style={s.topRight}>
          <Text style={s.docNumber}>{estimate.estimateNumber}</Text>
          <Text style={s.docDate}>{fmtDate(estimate.issueDate)}</Text>
        </View>

        {/* タイトル */}
        <Text style={s.title}>見積書</Text>

        {/* ヘッダー 2カラム */}
        <View style={s.headerRow}>
          {/* 左：送付先 + カスタムフィールド */}
          <View style={s.headerLeft}>
            <Text style={s.toLabel}>送付先</Text>
            <Text style={s.toCompany}>{customer?.companyName} 御中</Text>

            {customFields.map((cf, i) => (
              <View key={i} style={s.cfRow}>
                <Text style={s.cfLabel}>{cf.label}</Text>
                <Text style={s.cfColon}> : </Text>
                <Text style={s.cfValue}>{cf.value}</Text>
              </View>
            ))}
          </View>

          {/* 右：自社情報 + 印鑑 */}
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

            {/* 印鑑枠（3マス） */}
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
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadText, s.colDesc]}>項目 &amp; 詳細</Text>
            <Text style={[s.tableHeadText, s.colQty]}>数量</Text>
            <Text style={[s.tableHeadText, s.colUnit]}>単位</Text>
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
              <Text style={[{ fontSize: 8 }, s.colQty]}>{item.quantity}</Text>
              <Text style={[{ fontSize: 8, color: C.gray }, s.colUnit]}>{item.unit}</Text>
              <Text style={[{ fontFamily: 'Inter', fontSize: 8 }, s.colPrice]}>{fmtNum(item.unitPrice)}</Text>
              <Text style={[{ fontFamily: 'Inter', fontSize: 8, color: C.gray }, s.colTax]}>
                {(item.taxRate ?? 10) === 0 ? '-' : `${item.taxRate ?? 10}`}
              </Text>
              <Text style={[{ fontFamily: 'Inter', fontSize: 8 }, s.colAmt]}>{fmtNum(item.amount)}</Text>
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
            <Text style={s.totalLineLabel}>消費税</Text>
            <Text style={s.totalLineValue}>{fmtNum(taxAmount)}</Text>
          </View>
          {discount > 0 && (
            <View style={s.totalLine}>
              <Text style={s.totalLineLabel}>値引き (-)</Text>
              <Text style={s.totalLineValue}>{fmtNum(discount)}</Text>
            </View>
          )}
          <View style={s.grandTotalRow}>
            <Text style={s.grandLabel}>総額</Text>
            <Text style={s.grandValue}>¥{fmtNum(total)}</Text>
          </View>
        </View>

        {/* 備考・取引条件 */}
        {estimate.notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>備考</Text>
            <View style={s.noteBox}><Text>{estimate.notes}</Text></View>
          </View>
        )}
        {estimate.terms && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>取引条件</Text>
            <Text>{estimate.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
