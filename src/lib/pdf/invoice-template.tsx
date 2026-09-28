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
import { Invoice } from '@/types';

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
  bankBox: { backgroundColor: '#eff6ff', padding: 8, borderRadius: 4, marginTop: 4 },
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

export function InvoicePDF({ invoice }: { invoice: Invoice }) {
  const { customer } = invoice;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>請 求 書</Text>

        <View style={styles.twoCol}>
          {/* 請求先 */}
          <View style={styles.box}>
            <Text style={styles.boxTitle}>請求先</Text>
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
              <Text style={styles.label}>請求番号:</Text>
              <Text style={styles.value}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>発行日:</Text>
              <Text style={styles.value}>{fmtDate(invoice.issueDate)}</Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.row}>
                <Text style={styles.label}>支払期限:</Text>
                <Text style={styles.value}>{fmtDate(invoice.dueDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {invoice.subject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>件名</Text>
            <Text>{invoice.subject}</Text>
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
            {invoice.lineItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
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
              <Text style={styles.totalValue}>¥{fmtCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>消費税 ({invoice.taxRate}%):</Text>
              <Text style={styles.totalValue}>¥{fmtCurrency(invoice.taxAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.totalBold]}>合計:</Text>
              <Text style={[styles.totalValue, styles.totalBold]}>¥{fmtCurrency(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {invoice.bankInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>お振込先</Text>
            <View style={styles.bankBox}><Text>{invoice.bankInfo}</Text></View>
          </View>
        )}

        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>備考</Text>
            <View style={styles.noteBox}><Text>{invoice.notes}</Text></View>
          </View>
        )}

        {invoice.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>取引条件</Text>
            <Text>{invoice.terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
