'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ItemMaster {
  id: number;
  name: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      else setError(data.error ?? '読み込みに失敗しました');
    } catch (e: any) {
      setError(e.message ?? '読み込みに失敗しました');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setName('');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('この品目を削除しますか？')) return;
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-bold text-gray-900">品目マスタ</h2>

      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
        <h3 className="font-medium text-gray-800 text-sm">品目を登録</h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="品目名"
            required
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> 追加
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">登録された品目がありません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-800">{item.name}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
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
