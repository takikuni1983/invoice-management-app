'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Customer } from '@/types';
import { responseError } from '@/lib/response-error';

interface Props {
  customer?: Customer;
}

export default function CustomerForm({ customer }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: customer?.companyName ?? '',
    contactName: customer?.contactName ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    postalCode: customer?.postalCode ?? '',
    prefecture: customer?.prefecture ?? '',
    city: customer?.city ?? '',
    addressLine1: customer?.addressLine1 ?? '',
    addressLine2: customer?.addressLine2 ?? '',
    notes: customer?.notes ?? '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error(await responseError(res, '保存に失敗しました'));
      }
      router.push('/customers');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">基本情報</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名 <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.companyName}
              onChange={set('companyName')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="株式会社〇〇"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              担当者名 <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.contactName}
              onChange={set('contactName')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              value={form.phone}
              onChange={set('phone')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="03-0000-0000"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
        <h3 className="font-medium text-gray-900 border-b pb-2">住所</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
            <input
              value={form.postalCode}
              onChange={set('postalCode')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100-0001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
            <input
              value={form.prefecture}
              onChange={set('prefecture')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="東京都"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
            <input
              value={form.city}
              onChange={set('city')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="千代田区"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">番地</label>
            <input
              value={form.addressLine1}
              onChange={set('addressLine1')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1-1-1"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">建物名・部屋番号</label>
          <input
            value={form.addressLine2}
            onChange={set('addressLine2')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="〇〇ビル 5F"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : customer ? '更新する' : '登録する'}
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
