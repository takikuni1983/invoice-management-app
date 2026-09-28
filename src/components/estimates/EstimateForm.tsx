'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Estimate, Customer } from '@/types';
import LineItemsEditor, { LineItemRow } from '@/components/line-items/LineItemsEditor';
import { formatDateInput, ESTIMATE_STATUS_LABELS, formatCurrency } from '@/lib/utils';

interface CustomFieldRow { label: string; value: string; }

interface Props {
  estimate?: Estimate;
  customers: Customer[];
  defaultCustomerId?: number;
}

export default function EstimateForm({ estimate, customers, defaultCustomerId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerId: estimate?.customerId ?? defaultCustomerId ?? '',
    status: estimate?.status ?? 'DRAFT',
    issueDate: formatDateInput(estimate?.issueDate) || new Date().toISOString().slice(0, 10),
    expiryDate: formatDateInput(estimate?.expiryDate),
    subject: estimate?.subject ?? '',
    notes: estimate?.notes ?? '',
    terms: estimate?.terms ?? '',
  });

  const [discount, setDiscount] = useState(estimate?.discount ?? 0);

  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    estimate?.lineItems.map((li) => ({
      description: li.description,
      details: (li as any).details ?? '',
      quantity: li.quantity,
      unit: li.unit ?? '',
      unitPrice: li.unitPrice,
      amount: li.amount,
      taxRate: li.taxRate ?? 10,
    })) ?? [{ description: '', details: '', quantity: 1, unit: '式', unitPrice: 0, amount: 0, taxRate: 10 }]
  );

  const [customFields, setCustomFields] = useState<CustomFieldRow[]>(
    estimate?.customFields?.map(cf => ({ label: cf.label, value: cf.value })) ?? []
  );
  const [fieldLabels, setFieldLabels] = useState<string[]>([]);

  const loadFieldLabels = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/fields');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setFieldLabels(data.map((d: any) => d.label));
    } catch {}
  }, []);

  useEffect(() => { loadFieldLabels(); }, [loadFieldLabels]);

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function addCustomField(label: string) {
    if (!label || customFields.some(cf => cf.label === label)) return;
    setCustomFields(prev => [...prev, { label, value: '' }]);
  }

  function updateCustomField(index: number, value: string) {
    setCustomFields(prev => prev.map((cf, i) => i === index ? { ...cf, value } : cf));
  }

  function removeCustomField(index: number) {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = lineItems.reduce((sum, item) => sum + Math.round(item.amount * item.taxRate / 100), 0);
  const total = subtotal + taxAmount - discount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = estimate ? `/api/estimates/${estimate.id}` : '/api/estimates';
      const method = estimate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lineItems,
          discount,
          customFields: customFields.map((cf, i) => ({ ...cf, sortOrder: i })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '保存に失敗しました');
      }
      const saved = await res.json();
      router.push(`/estimates/${saved.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const unusedLabels = fieldLabels.filter(l => !customFields.some(cf => cf.label === l));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {/* 基本情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">基本情報</h3>
        <div className="grid grid-cols-2 gap-4">
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
              {Object.entries(ESTIMATE_STATUS_LABELS).map(([k, v]) => (
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
            <label className="block text-sm font-medium text-gray-700 mb-1">有効期限</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={set('expiryDate')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">件名</label>
            <input
              value={form.subject}
              onChange={set('subject')}
              placeholder="〇〇に関するご見積"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* カスタム項目 */}
        {(customFields.length > 0 || unusedLabels.length > 0) && (
          <div className="pt-2 space-y-2">
            <p className="text-sm font-medium text-gray-700">カスタム項目</p>
            {customFields.map((cf, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-32 shrink-0">{cf.label}</span>
                <input
                  value={cf.value}
                  onChange={(e) => updateCustomField(i, e.target.value)}
                  placeholder={cf.label}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => removeCustomField(i)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {unusedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {unusedLabels.map(label => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => addCustomField(label)}
                    className="flex items-center gap-1 text-xs px-2 py-1 border border-dashed border-blue-400 text-blue-600 rounded hover:bg-blue-50"
                  >
                    <Plus className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 明細行 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">明細</h3>
        <LineItemsEditor items={lineItems} onChange={setLineItems} />

        {/* 値引き */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            {discount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">値引き</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <label className="text-gray-600 text-sm">値引き額</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                className="w-32 text-right border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between py-1 font-bold text-base border-t border-gray-200 pt-2">
              <span>総額</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 備考・条件 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
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
          {saving ? '保存中...' : estimate ? '更新する' : '作成する'}
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
