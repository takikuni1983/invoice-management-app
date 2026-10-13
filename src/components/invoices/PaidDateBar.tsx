'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { responseError } from '@/lib/response-error';

interface Props {
  invoiceId: number;
  /** yyyy-mm-dd */
  paidAt: string;
}

// 入金済みの請求書の入金日（書類の枠外に表示）。日付を変えると「保存」ボタンが出る
// （日付欄を手入力すると途中の値でも change が起きるので、自動保存にはしない）
export default function PaidDateBar({ invoiceId, paidAt }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(paidAt);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ステータスの切り替えなどでサーバー側の値が変わったら追従する
  useEffect(() => { setValue(paidAt); }, [paidAt]);

  async function save(next: string) {
    if (!next || next === paidAt) return;
    if (Number(next.slice(0, 4)) < 2000) { alert('入金日の年が正しくありません'); return; }
    setState('saving');
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAt: next }),
      });
      if (!res.ok) throw new Error(await responseError(res, '入金日の保存に失敗しました'));
      setState('saved');
      router.refresh();
      setTimeout(() => setState('idle'), 2000);
    } catch (err: any) {
      setValue(paidAt);
      setState('idle');
      alert(err.message);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-1.5 font-medium text-green-700">
        <CheckCircle className="h-4 w-4" /> 入金済み
      </span>
      <label className="flex items-center gap-2 text-gray-700">
        入金日
        <input
          type="date"
          value={value}
          required
          disabled={state === 'saving'}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(value); }}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      {value !== paidAt && state !== 'saving' && (
        <>
          <button
            type="button"
            onClick={() => save(value)}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
          >
            保存
          </button>
          <button type="button" onClick={() => setValue(paidAt)} className="text-xs text-gray-500 hover:underline">
            取り消し
          </button>
        </>
      )}
      {state === 'saving' && <span className="text-xs text-gray-500">保存中...</span>}
      {state === 'saved' && <span className="text-xs text-green-700">保存しました</span>}
    </div>
  );
}
