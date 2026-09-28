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

const _fontBuf = fs.readFileSync(path.join(process.cwd(), 'public/fonts/IPAPGothic.ttf'));
const _fontSrc = `data:font/truetype;base64,${_fontBuf.toString('base64')}`;
Font.register({ family: 'IPAPGothic', src: _fontSrc });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'IPAPGothic',
    fontSize: 9,
    padding: 40,
    color: '#1f2937',
  },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#6b7280', width: 80 },
  value: { flex: 1 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 8, color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 2, marginBottom: 6 },
  table: { borderTop: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb' },
  tableHeader: { backgroundColor: '#f9fafb' },
  cell: { borderRight: '1px solid #e5e7eb', padding: '4 6' },
  colDesc: { flex: 3 },
  colQty: { width: 45, textAlign: 'right' },
  colUnit: { width: 35, textAlign: 'center' },
  colPrice: { width: 70, textAlign: 'right' },
  colAmt: { width: 75, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  totalLabel: { width: 100, textAlign: 'right', paddingRight: 8, color: '#6b7280' },
  totalValue: { width: 80, textAlign: 'right' },
  totalBold: { fontWeight: 'bold', fontSize: 11 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  box: { width: '48%' },
  boxTitle: { fontSize: 8, color: '#6b7280', marginBottom: 4 },
  companyName: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  noteBox: { backgroundColor: '#f9fafb', padding: 8, borderRadius: 4, marginTop: 4 },
});

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '-';
  try {
    const date = d instanceof Date ? d : parseISO(String(d));
    return format(date, 'yyyy年M月d日', { locale: ja });
  } catch { return String(d); }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('ja-JP').format(Math.round(n));
}

export function EstimatePDF({ estimate }: { estimate: Estimate }) {
  const { customer } = estimate;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>見 積 書</Text>

        <View style={styles.twoCol}>
          {/* 請求先 */}
          <View style={styles.box}>
            <Text style={styles.boxTitle}>お見積先</Text>
            <Text style={styles.companyName}>{customer?.companyName}</Text>
            <Text>{customer?.contactName} 様</Text>
            {customer?.postalCode && <Text style={{ marginTop: 4 }}>〒{customer.postalCode}</Text>}
            <Text>{customer?.prefecture}{customer?.city}{customer?.addressLine1}</Text>
            {customer?.addressLine2 && <Text>{customer.addressLine2}</Text>}
            {customer?.phone && <Text>TEL: {customer.phone}</Text>}
          </View>

          {/* メタ情報 */}
          <View style={styles.box}>
            <View style={styles.row}>
              <Text style={styles.label}>見積番号:</Text>
              <Text style={styles.value}>{estimate.estimateNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>発行日:</Text>
              <Text style={styles.value}>{fmtDate(estimate.issueDate)}</Text>
            </View>
            {estimate.expiryDate && (
              <View style={styles.row}>
                <Text style={styles.label}>有効期限:</Text>
                <Text style={styles.value}>{fmtDate(estimate.expiryDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {estimate.subject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>件名</Text>
            <Text>{estimate.subject}</Text>
          </View>
        )}
        {(estimate as any).projectName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>案件名</Text>
            <Text>{(estimate as any).projectName}</Text>
          </View>
        )}

        {/* 明細テーブル */}
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.colDesc]}>項目</Text>
              <Text style={[styles.cell, styles.colQty]}>数量</Text>
              <Text style={[styles.cell, styles.colUnit]}>単位</Text>
              <Text style={[styles.cell, styles.colPrice]}>単価</Text>
              <Text style={[styles.cell, styles.colAmt]}>金額</Text>
            </View>
            {estimate.lineItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.cell, styles.colDesc]}>
                  <Text>{item.description}</Text>
                  {(item as any).details ? <Text style={{ fontSize: 7, color: '#6b7280', marginTop: 2 }}>注釈: {(item as any).details}</Text> : null}
                </View>
                <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.cell, styles.colPrice]}>{fmtCurrency(item.unitPrice)}</Text>
                <Text style={[styles.cell, styles.colAmt]}>{fmtCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 8 }}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>小計:</Text>
              <Text style={styles.totalValue}>¥{fmtCurrency(estimate.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>消費税 ({estimate.taxRate}%):</Text>
              <Text style={styles.totalValue}>¥{fmtCurrency(estimate.taxAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.totalBold]}>合計:</Text>
              <Text style={[styles.totalValue, styles.totalBold]}>¥{fmtCurrency(estimate.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {estimate.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>備考</Text>
            <View style={styles.noteBox}><Text>{estimate.notes}</Text></View>
          </View>
        )}

        {estimate.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>取引条件</Text>
            <Text>{estimate.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
