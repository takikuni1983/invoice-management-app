'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  cn,
  ESTIMATE_STATUS_LABELS, ESTIMATE_STATUS_COLORS,
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS,
} from '@/lib/utils';
import { responseError } from '@/lib/response-error';

const MAPS = {
  estimate: { labels: ESTIMATE_STATUS_LABELS, colors: ESTIMATE_STATUS_COLORS, api: 'estimates' },
  invoice:  { labels: INVOICE_STATUS_LABELS,  colors: INVOICE_STATUS_COLORS,  api: 'invoices' },
  order:    { labels: ORDER_STATUS_LABELS,    colors: ORDER_STATUS_COLORS,    api: 'orders' },
  delivery: { labels: DELIVERY_STATUS_LABELS, colors: DELIVERY_STATUS_COLORS, api: 'delivery-notes' },
};

interface Props {
  id: number;
  status: string;
  type: keyof typeof MAPS;
}

// 詳細画面のステータス: バッジと同じ見た目のプルダウン。選ぶとすぐ保存する
export default function StatusSelect({ id, status, type }: Props) {
  const router = useRouter();
  const { labels, colors, api } = MAPS[type];
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    const prev = value;
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/${api}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'ステータスの変更に失敗しました'));
      router.refresh();
    } catch (err: any) {
      setValue(prev);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className={cn('relative inline-flex items-center rounded-full text-xs font-medium', colors[value], saving && 'opacity-60')}>
      <span className="sr-only">ステータス</span>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none bg-transparent pl-2.5 pr-6 py-0.5 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="ステータスを変更"
      >
        {Object.entries(labels).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3.5 w-3.5" />
    </label>
  );
}
