'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeliveryNote, Customer } from '@/types';
import LineItemsEditor, { LineItemRow, DEFAULT_TAX_RATE } from '@/components/line-items/LineItemsEditor';
import DocNumberField from '@/components/forms/DocNumberField';
import CustomFieldsEditor, { CustomFieldRow } from '@/components/forms/CustomFieldsEditor';
import DiscountTotal from '@/components/forms/DiscountTotal';
import { useMasterItems } from '@/components/forms/useMasterItems';
import { formatDateInput, DELIVERY_STATUS_LABELS } from '@/lib/utils';
import { responseError } from '@/lib/response-error';

// 請求書から作成するときは invoiceId 付きの未保存データを note に渡す
export type DeliveryNoteFormInitial = Partial<Omit<DeliveryNote, 'id'>> & { id?: number };

interface Props {
  note?: DeliveryNoteFormInitial;
  customers: Customer[];
  defaultCustomerId?: number;
  /** 新規作成時に自動で振られる予定の番号 */
  suggestedNumber?: string;
}

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function DeliveryNoteForm({ note, customers, defaultCustomerId, suggestedNumber }: Props) {
  const router = useRouter();
  const isEdit = note?.id != null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    deliveryNumber: note?.deliveryNumber ?? '',
    customerId: note?.customerId ?? defaultCustomerId ?? '',
    status: note?.status ?? 'DRAFT',
    deliveryDate: formatDateInput(note?.deliveryDate) || new Date().toISOString().slice(0, 10),
    subject: note?.subject ?? '',
    deliveryFormat: note?.deliveryFormat ?? '',
    notes: note?.notes ?? '',
  });

  const [discount, setDiscount] = useState(note?.discount ?? 0);

  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    note?.lineItems?.length
      ? note.lineItems.map((li) => ({
          description: li.description,
          details: li.details ?? '',
          quantity: li.quantity,
          unit: li.unit ?? '',
          unitPrice: li.unitPrice,
          amount: li.amount,
          taxRate: li.taxRate ?? DEFAULT_TAX_RATE,
        }))
      : [{ description: '', details: '', quantity: 1, unit: '', unitPrice: 0, amount: 0, taxRate: DEFAULT_TAX_RATE }]
  );

  const [customFields, setCustomFields] = useState<CustomFieldRow[]>(
    note?.customFields?.map(cf => ({ label: cf.label, value: cf.value })) ?? []
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
      const url = isEdit ? `/api/delivery-notes/${note!.id}` : '/api/delivery-notes';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          invoiceId: note?.invoiceId ?? null,
          lineItems,
          discount,
          customFields: customFields.map((cf, i) => ({ ...cf, sortOrder: i })),
        }),
      });
      if (!res.ok) {
        throw new Error(await responseError(res, '保存に失敗しました'));
      }
      const saved = await res.json();
      router.push(`/delivery-notes/${saved.id}`);
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">基本情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 sm:w-1/2 sm:pr-2">
            <DocNumberField
              label="番号"
              value={form.deliveryNumber}
              onChange={(value) => setForm((f) => ({ ...f, deliveryNumber: value }))}
              suggested={suggestedNumber}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              納品先（顧客） <span className="text-red-500">*</span>
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
              {Object.entries(DELIVERY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              納品日 <span className="text-red-500">*</span>
            </label>
            <input required type="date" value={form.deliveryDate} onChange={set('deliveryDate')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">納入形式</label>
            <input value={form.deliveryFormat} onChange={set('deliveryFormat')} placeholder="データ納品・印刷物納品" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">案件名</label>
            <input value={form.subject} onChange={set('subject')} placeholder="〇〇 プロモーションツール制作" className={inputClass} />
          </div>
        </div>

        <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
      </div>

      {/* 明細行 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">明細</h3>
        <LineItemsEditor items={lineItems} onChange={setLineItems} masterItems={masterItems} />

        <DiscountTotal lineItems={lineItems} discount={discount} onDiscountChange={setDiscount} />
      </div>

      {/* 備考 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
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
