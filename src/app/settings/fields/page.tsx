'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FieldLabel { id: number; label: string; }

export default function FieldsSettingsPage() {
  const [labels, setLabels] = useState<FieldLabel[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/settings/fields');
    const d = await res.json();
    if (Array.isArray(d)) setLabels(d);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/settings/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: name }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); }
    else { setName(''); await load(); }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('このカスタム項目を削除しますか？')) return;
    await fetch(`/api/settings/fields/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">カスタム項目ラベル</h2>
        <p className="text-sm text-gray-500 mt-1">見積書に表示するラベルを登録します（例：有効期限、案件名、支払条件）</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="ラベル名（例：有効期限）" required
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={saving}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
            <Plus className="h-4 w-4" /> 追加
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {labels.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">ラベルが登録されていません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {labels.map(l => (
              <li key={l.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{l.label}</span>
                <button onClick={() => handleDelete(l.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
