'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderAcceptance, Customer } from '@/types';
import LineItemsEditor, { LineItemRow } from '@/components/line-items/LineItemsEditor';
import CustomFieldsEditor, { CustomFieldRow } from '@/components/forms/CustomFieldsEditor';
import DiscountTotal from '@/components/forms/DiscountTotal';
import { useMasterItems } from '@/components/forms/useMasterItems';
import { formatDateInput, ORDER_STATUS_LABELS } from '@/lib/utils';

// 見積書から作成するときは estimateId 付きの未保存データを order に渡す
export type OrderFormInitial = Partial<Omit<OrderAcceptance, 'id'>> & { id?: number };

interface Props {
  order?: OrderFormInitial;
  customers: Customer[];
  defaultCustomerId?: number;
}

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function OrderForm({ order, customers, defaultCustomerId }: Props) {
  const router = useRouter();
  const isEdit = order?.id != null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerId: order?.customerId ?? defaultCustomerId ?? '',
    status: order?.status ?? 'DRAFT',
    orderDate: formatDateInput(order?.orderDate) || new Date().toISOString().slice(0, 10),
    subject: order?.subject ?? '',
    deliveryDate: formatDateInput(order?.deliveryDate),
    deliveryPlace: order?.deliveryPlace ?? '',
    paymentTerms: order?.paymentTerms ?? '',
    notes: order?.notes ?? '',
  });

  const [discount, setDiscount] = useState(order?.discount ?? 0);

  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    order?.lineItems?.length
      ? order.lineItems.map((li) => ({
          description: li.description,
          details: li.details ?? '',
          quantity: li.quantity,
          unit: li.unit ?? '',
          unitPrice: li.unitPrice,
          amount: li.amount,
          taxRate: li.taxRate ?? 10,
        }))
      : [{ description: '', details: '', quantity: 1, unit: '式', unitPrice: 0, amount: 0, taxRate: 10 }]
  );

  const [customFields, setCustomFields] = useState<CustomFieldRow[]>(
    order?.customFields?.map(cf => ({ label: cf.label, value: cf.value })) ?? []
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
      const url = isEdit ? `/api/orders/${order!.id}` : '/api/orders';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimateId: order?.estimateId ?? null,
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
      router.push(`/orders/${saved.id}`);
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

      {/* 基本情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">基本情報</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              発注元（顧客） <span className="text-red-500">*</span>
            </label>
            <select required value={form.customerId} onChange={set('customerId')} className={inputClass}>
              <option value="">顧客を選択</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select value={form.status} onChange={set('status')} className={inputClass}>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              発注日 <span className="text-red-500">*</span>
            </label>
            <input required type="date" value={form.orderDate} onChange={set('orderDate')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">納期</label>
            <input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">案件名</label>
            <input value={form.subject} onChange={set('subject')} placeholder="〇〇 Webサイト改修" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">納入場所</label>
            <input value={form.deliveryPlace} onChange={set('deliveryPlace')} placeholder="データ納品" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払条件</label>
            <input value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="月末締め翌月末払い 銀行振込" className={inputClass} />
          </div>
        </div>

        <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
      </div>

      {/* 明細行 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">明細</h3>
        <LineItemsEditor items={lineItems} onChange={setLineItems} masterItems={masterItems} />

        <DiscountTotal lineItems={lineItems} discount={discount} onDiscountChange={setDiscount} />
      </div>

      {/* 備考 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">備考</h3>
        <textarea value={form.notes} onChange={set('notes')} rows={3} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : isEdit ? '更新する' : '作成する'}
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
