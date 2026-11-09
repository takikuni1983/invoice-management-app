'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

// 請求済みの見積書からも、もう1枚請求書を作れる（分割請求など）。そのときは確認文で知らせる
export default function ConvertToInvoiceButton({ estimateId, invoiced = false }: { estimateId: number; invoiced?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConvert() {
    const message = invoiced
      ? 'この見積書からは既に請求書を作成しています。もう1枚請求書を作成しますか？'
      : 'この見積書を請求書に変換しますか？見積書のステータスが「請求済み」になります。';
    if (!confirm(message)) return;
    setLoading(true);
    try {
      // Fetch estimate data first
      const estRes = await fetch(`/api/estimates/${estimateId}`);
      const estimate = await estRes.json();

      // Create invoice with estimate data
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: estimate.customerId,
          estimateId: estimate.id,
          status: 'DRAFT',
          issueDate: new Date().toISOString().slice(0, 10),
          subject: estimate.subject,
          notes: estimate.notes,
          terms: estimate.terms,
          taxRate: estimate.taxRate,
          lineItems: estimate.lineItems,
          discount: estimate.discount,
          customFields: estimate.customFields,
        }),
      });

      if (!res.ok) throw new Error('変換に失敗しました');
      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConvert}
      disabled={loading}
      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      <FileText className="h-4 w-4" />
      {loading ? '変換中...' : '請求書に変換'}
    </button>
  );
}
