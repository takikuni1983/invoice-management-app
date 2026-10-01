'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn, formatCurrency } from '@/lib/utils';

// PC（xl 以上）の詳細画面で、サイドバーと詳細の間に出す書類の一覧
// 一覧・新規作成・編集画面では表示しない（フォームの幅を確保する）

export interface SideListItem {
  id: number;
  number: string;
  customerName: string;
  subject: string | null;
  total: number;
  status: string;
  date: string;
}

interface Props {
  title: string;
  basePath: string;
  badgeType: 'estimate' | 'invoice' | 'order' | 'delivery';
  items: SideListItem[];
}

export default function DocSideList({ title, basePath, badgeType, items }: Props) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const activeRef = useRef<HTMLAnchorElement>(null);

  // 詳細画面（/見積書/123）のときだけ表示する（一覧・新規作成・編集では出さない）
  const match = pathname.match(new RegExp(`^${basePath}/(\\d+)$`));
  const activeId = match ? Number(match[1]) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      [i.number, i.customerName, i.subject ?? ''].some(v => v.toLowerCase().includes(q)),
    );
  }, [items, query]);

  // 選択中の書類が見える位置までスクロール
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  if (activeId === null) return null;

  return (
    <aside
      className="hidden xl:flex flex-col w-72 shrink-0 sticky top-20 bg-white rounded-lg border border-gray-200 overflow-hidden"
      style={{ height: 'calc(100vh - 6.5rem)' }}
    >
      <div className="px-3 py-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <Link href={basePath} className="text-sm font-medium text-gray-900 hover:underline">{title}一覧</Link>
          <span className="text-xs text-gray-400">{filtered.length}件</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="番号・顧客名・件名"
            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {filtered.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                ref={active ? activeRef : undefined}
                href={`${basePath}/${item.id}`}
                className={cn(
                  'block px-3 py-2.5 hover:bg-gray-50',
                  active && 'bg-blue-50 hover:bg-blue-50 border-l-2 border-blue-600 pl-[10px]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-xs', active ? 'text-blue-700 font-medium' : 'text-gray-500')}>{item.number}</span>
                  <StatusBadge status={item.status} type={badgeType} />
                </div>
                <p className="text-sm font-medium text-[color:var(--foreground)] truncate mt-0.5">{item.customerName}</p>
                {item.subject && <p className="text-xs text-[color:var(--foreground)] truncate">{item.subject}</p>}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{item.date}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{formatCurrency(item.total)}</span>
                </div>
              </Link>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-gray-400">該当する書類がありません</li>}
      </ul>
    </aside>
  );
}
