'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice, Customer } from '@/types';
import LineItemsEditor, { LineItemRow, DEFAULT_TAX_RATE } from '@/components/line-items/LineItemsEditor';
import DocNumberField from '@/components/forms/DocNumberField';
import CustomFieldsEditor, { CustomFieldRow } from '@/components/forms/CustomFieldsEditor';
import DiscountTotal from '@/components/forms/DiscountTotal';
import { useMasterItems } from '@/components/forms/useMasterItems';
import { formatDateInput, INVOICE_STATUS_LABELS } from '@/lib/utils';
import { responseError } from '@/lib/response-error';

interface Props {
  invoice?: Invoice;
  customers: Customer[];
  defaultCustomerId?: number;
  /** 新規作成時に自動で振られる予定の番号 */
  suggestedNumber?: string;
}

export default function InvoiceForm({ invoice, customers, defaultCustomerId, suggestedNumber }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    invoiceNumber: invoice?.invoiceNumber ?? '',
    customerId: invoice?.customerId ?? defaultCustomerId ?? '',
    status: invoice?.status ?? 'DRAFT',
    issueDate: formatDateInput(invoice?.issueDate) || new Date().toISOString().slice(0, 10),
    dueDate: formatDateInput(invoice?.dueDate),
    subject: invoice?.subject ?? '',
    notes: invoice?.notes ?? '',
    terms: invoice?.terms ?? '',
  });
  const [taxRate] = useState(invoice?.taxRate ?? 10);
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    invoice?.lineItems.map((li) => ({
      description: li.description,
      details: li.details ?? '',
      quantity: li.quantity,
      unit: li.unit ?? '',
      unitPrice: li.unitPrice,
      amount: li.amount,
      taxRate: li.taxRate ?? DEFAULT_TAX_RATE,
    })) ?? [{ description: '', details: '', quantity: 1, unit: '', unitPrice: 0, amount: 0, taxRate: DEFAULT_TAX_RATE }]
  );
  const [discount, setDiscount] = useState(invoice?.discount ?? 0);
  const [customFields, setCustomFields] = useState<CustomFieldRow[]>(
    invoice?.customFields?.map(cf => ({ label: cf.label, value: cf.value })) ?? []
  );
  const masterItems = useMasterItems();

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices';
      const method = invoice ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          taxRate,
          lineItems,
          discount,
          customFields: customFields.map((cf, i) => ({ ...cf, sortOrder: i })),
          // 編集時に入金日を消さない
          ...(invoice ? { paidAt: invoice.paidAt ?? null } : {}),
        }),
      });
      if (!res.ok) {
        throw new Error(await responseError(res, '保存に失敗しました'));
      }
      const saved = await res.json();
      router.push(`/invoices/${saved.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">基本情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 sm:w-1/2 sm:pr-2">
            <DocNumberField
              label="請求番号"
              value={form.invoiceNumber}
              onChange={(value) => setForm((f) => ({ ...f, invoiceNumber: value }))}
              suggested={suggestedNumber}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              顧客 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.customerId}
              onChange={set('customerId')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">顧客を選択</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              発行日 <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="date"
              value={form.issueDate}
              onChange={set('issueDate')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払期限</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
            <input
              value={form.subject}
              onChange={set('subject')}
              placeholder="〇〇に関するご請求"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">明細</h3>
        <LineItemsEditor items={lineItems} onChange={setLineItems} masterItems={masterItems} />

        <DiscountTotal lineItems={lineItems} discount={discount} onDiscountChange={setDiscount} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">備考・条件</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">取引条件</label>
          <textarea
            value={form.terms}
            onChange={set('terms')}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : invoice ? '更新する' : '作成する'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
