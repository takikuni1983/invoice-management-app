import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { buildQuery, SortDir, SortState } from '@/lib/sort';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  sortKey: string;
  sort: SortState;
  basePath: string;
  /** 並び替え以外の現在のクエリ（検索・ステータスなど） */
  params: Record<string, string | undefined>;
  align?: 'left' | 'right' | 'center';
  /** 初回クリック時の向き（日付・金額は新しい/大きい順から） */
  firstDir?: SortDir;
  className?: string;
}

// クリックで昇順/降順を切り替える表の見出し
export default function SortHeader({
  label, sortKey, sort, basePath, params, align = 'left', firstDir = 'asc', className,
}: Props) {
  const active = sort.key === sortKey;
  const nextDir: SortDir = active ? (sort.dir === 'asc' ? 'desc' : 'asc') : firstDir;
  const href = basePath + buildQuery({ ...params, sort: sortKey, dir: nextDir });
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      className={cn(
        'whitespace-nowrap px-3 py-3 font-medium text-gray-600',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-1 hover:text-gray-900',
          align === 'right' && 'flex-row-reverse',
          align === 'center' && 'justify-center',
          active && 'text-gray-900',
        )}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', active ? 'text-blue-600' : 'text-gray-300')} />
      </Link>
    </th>
  );
}
