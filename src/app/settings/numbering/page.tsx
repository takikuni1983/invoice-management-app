'use client';

import { useCallback, useEffect, useState } from 'react';

interface Row {
  docType: string;
  label: string;
  prefix: string;
  lastNumber: number | string;
  digits: number | string;
  next: string;
}

const inputClass =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// 入力を変えていなければサーバーが計算した次の番号（使用済みを飛ばした結果）を表示する
function preview(r: Row, loaded?: Row) {
  if (loaded && String(r.prefix) === String(loaded.prefix) && String(r.lastNumber) === String(loaded.lastNumber)
    && String(r.digits) === String(loaded.digits)) return r.next;
  const last = Number(r.lastNumber);
  const digits = Number(r.digits);
  if (!Number.isInteger(last) || last < 0 || !Number.isInteger(digits) || digits < 1) return '-';
  return `${r.prefix}${String(last + 1).padStart(digits, '0')}`;
}

export default function NumberingSettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/settings/numbering');
    const d = await res.json();
    if (Array.isArray(d)) { setRows(d); setLoaded(d); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(i: number, key: 'prefix' | 'lastNumber' | 'digits', value: string) {
    setSaved(false);
    setRows(prev => prev.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/settings/numbering', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows.map(r => ({
          docType: r.docType, prefix: r.prefix, lastNumber: Number(r.lastNumber), digits: Number(r.digits),
        }))),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? '保存に失敗しました');
      setRows(d);
      setLoaded(d);
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      <p className="text-sm text-gray-600">
        新しく書類を作るとき、番号欄を空欄のまま保存すると「接頭辞 ＋（最新の番号 ＋ 1）」が自動で振られます。
        既に使われている番号は自動で飛ばします。
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.docType} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 className="font-medium text-gray-900">{r.label}</h3>
              <p className="text-sm text-gray-500">
                次の番号：<span className="font-medium text-gray-900">{preview(r, loaded[i])}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm text-gray-700">
                接頭辞
                <input value={r.prefix} onChange={e => update(i, 'prefix', e.target.value)} placeholder="EST-" className={`mt-1 ${inputClass}`} />
              </label>
              <label className="text-sm text-gray-700">
                最新の番号
                <input type="number" min="0" inputMode="numeric" value={r.lastNumber} onChange={e => update(i, 'lastNumber', e.target.value)} className={`mt-1 ${inputClass}`} />
              </label>
              <label className="text-sm text-gray-700">
                桁数
                <input type="number" min="1" max="10" inputMode="numeric" value={r.digits} onChange={e => update(i, 'digits', e.target.value)} className={`mt-1 ${inputClass}`} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || rows.length === 0}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
        {saved && <span className="text-sm text-green-600">保存しました</span>}
      </div>
    </form>
  );
}
