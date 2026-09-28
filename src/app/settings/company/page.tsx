'use client';

import { useState, useEffect } from 'react';

export default function CompanySettingsPage() {
  const [form, setForm] = useState({
    companyName: '', ownerName: '', postalCode: '', address: '',
    phone: '', registrationNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/company').then(r => r.json()).then(d => {
      setForm({
        companyName: d.companyName ?? '',
        ownerName: d.ownerName ?? '',
        postalCode: d.postalCode ?? '',
        address: d.address ?? '',
        phone: d.phone ?? '',
        registrationNumber: d.registrationNumber ?? '',
      });
    }).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch('/api/settings/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const field = (label: string, key: string, placeholder?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input value={(form as any)[key]} onChange={set(key)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-bold text-gray-900">自社情報</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {field('会社名 / 屋号', 'companyName', 'COOKIE-DESIGNWORKS')}
        {field('担当者名', 'ownerName', '滝 邦彦')}
        {field('郵便番号', 'postalCode', '465-0053')}
        {field('住所', 'address', '愛知県名古屋市名東区極楽3-296')}
        {field('電話番号', 'phone', '090-0000-0000')}
        {field('登録番号（インボイス）', 'registrationNumber', 'T1234567890123')}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
          {saved && <span className="text-sm text-green-600">保存しました</span>}
        </div>
      </form>
    </div>
  );
}
