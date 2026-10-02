import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { buildQuery, SortState } from '@/lib/sort';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import SortHeader from '@/components/ui/SortHeader';

// 見積書・発注請書・納品書・請求書の一覧（PC: 並び替えできる表 / スマホ: カード）

export interface DocumentRow {
  id: number;
  number: string;
  customerName: string;
  subject: string | null;
  status: string;
  /** dateColumns と同じ順の日付 */
  dates: (Date | null)[];
  total: number;
  /** 元になった書類（元見積・元請求など） */
  source?: { href: string; label: string } | null;
}

interface Props {
  /** 例: '/estimates'。API は /api + basePath */
  basePath: string;
  deleteType: 'estimates' | 'invoices' | 'orders' | 'delivery-notes';
  badgeType: 'estimate' | 'invoice' | 'order' | 'delivery';
  numberLabel: string;
  newLabel: string;
  newHref?: string;
  searchPlaceholder: string;
  emptyMessage: string;
  statusTabs: { value: string; label: string }[];
  dateColumns: { key: string; label: string }[];
  sourceLabel?: string;
  rows: DocumentRow[];
  status: string;
  search: string;
  sort: SortState;
  /** 顧客で絞り込み中（詳細画面の顧客名リンクから来たとき） */
  customer?: { id: number; name: string } | null;
}

export const DOCUMENT_SORT_KEYS = ['number', 'customer', 'subject', 'status', 'total'] as const;

export default function DocumentList({
  basePath, deleteType, badgeType, numberLabel, newLabel, newHref, searchPlaceholder, emptyMessage,
  statusTabs, dateColumns, sourceLabel, rows, status, search, sort, customer,
}: Props) {
  const customerId = customer ? String(customer.id) : undefined;
  const params = { status, search, customerId };
  const sortParams = sort.key ? { sort: sort.key, dir: sort.dir } : {};
  const colCount = 6 + dateColumns.length + (sourceLabel ? 1 : 0);
  const header = (label: string, key: string, opts: { align?: 'left' | 'right'; firstDir?: 'asc' | 'desc' } = {}) => (
    <SortHeader label={label} sortKey={key} sort={sort} basePath={basePath} params={params} {...opts} />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form className="flex gap-2 flex-1 sm:flex-none">
          <input
            name="search"
            defaultValue={search}
            placeholder={searchPlaceholder}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {customerId && <input type="hidden" name="customerId" value={customerId} />}
          {sort.key && <input type="hidden" name="sort" value={sort.key} />}
          {sort.key && <input type="hidden" name="dir" value={sort.dir} />}
        </form>
        <Link
          href={newHref ?? `${basePath}/new${customerId ? `?customerId=${customerId}` : ''}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          {newLabel}
        </Link>
      </div>

      {/* 顧客での絞り込み（解除できる） */}
      {customer && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">顧客で絞り込み中:</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 pl-3 pr-1 py-1">
            <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">{customer.name}</Link>
            <Link
              href={basePath + buildQuery({ status, search, ...sortParams })}
              className="p-0.5 rounded-full hover:bg-blue-100"
              aria-label="絞り込みを解除"
              title="絞り込みを解除"
            >
              <X className="h-3.5 w-3.5" />
            </Link>
          </span>
        </div>
      )}

      {/* ステータスタブ */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={basePath + buildQuery({ status: tab.value, search, customerId, ...sortParams })}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              status === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* PC: 表 */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {header(numberLabel, 'number')}
              {header('顧客名', 'customer')}
              {header('件名', 'subject')}
              {sourceLabel && <th className="whitespace-nowrap text-left px-3 py-3 font-medium text-gray-600">{sourceLabel}</th>}
              {header('ステータス', 'status')}
              {dateColumns.map((c) => <SortHeader key={c.key} label={c.label} sortKey={c.key} sort={sort} basePath={basePath} params={params} firstDir="desc" />)}
              {header('金額', 'total', { align: 'right', firstDir: 'desc' })}
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center py-12 text-gray-400">{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-3">
                    <Link href={`${basePath}/${r.id}`} className="text-blue-600 hover:underline font-medium">
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[color:var(--foreground)] min-w-[6rem]">{r.customerName}</td>
                  <td className="px-3 py-3 text-[color:var(--foreground)] min-w-[10rem]">{r.subject || '-'}</td>
                  {sourceLabel && (
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {r.source ? <Link href={r.source.href} className="hover:underline">{r.source.label}</Link> : '-'}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-3">
                    <StatusBadge status={r.status} type={badgeType} />
                  </td>
                  {r.dates.map((d, i) => (
                    <td key={i} className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {d ? formatDate(d.toISOString()) : '-'}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-3 text-right font-medium">{formatCurrency(r.total)}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`${basePath}/${r.id}/edit`}
                        className="whitespace-nowrap text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                      >
                        編集
                      </Link>
                      <DeleteButton id={r.id} type={deleteType} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* スマホ: カード表示 */}
      <div className="md:hidden space-y-2">
        {rows.length === 0 ? (
          <p className="bg-white rounded-lg border border-gray-200 text-center py-10 text-sm text-gray-400">{emptyMessage}</p>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`${basePath}/${r.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{r.number}</p>
                  <p className="font-medium text-[color:var(--foreground)] truncate">{r.customerName}</p>
                  <p className="text-sm text-[color:var(--foreground)] truncate">{r.subject || '-'}</p>
                </div>
                <StatusBadge status={r.status} type={badgeType} />
              </div>
              <div className="flex items-end justify-between mt-2 gap-2">
                <p className="text-xs text-gray-500">
                  {dateColumns.map((c, i) => r.dates[i] && (
                    <span key={c.key} className="mr-2 whitespace-nowrap">{c.label} {formatDate(r.dates[i]!.toISOString())}</span>
                  ))}
                </p>
                <p className="font-medium whitespace-nowrap">{formatCurrency(r.total)}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
