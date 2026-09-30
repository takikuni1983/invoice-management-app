import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatCurrency, cn } from '@/lib/utils';
import SalesChart, { SalesPoint } from '@/components/sales/SalesChart';

// 売上管理: 見積承認金額と請求金額を 月別 / 半期別 / 年別 に集計する
// - 見積承認金額: ステータスが「承認済み」「請求済み」の見積書（発行日で集計）
// - 請求金額: 下書き以外の請求書（発行日で集計）
// - 金額はいずれも税込（totalAmount）

type Period = 'month' | 'half' | 'year';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'month', label: '月別' },
  { value: 'half', label: '半期別' },
  { value: 'year', label: '年別' },
];

interface Bucket extends SalesPoint {
  key: string;
  approvedCount: number;
  invoicedCount: number;
}

function bucketKey(d: Date, period: Period): string {
  const y = d.getFullYear();
  if (period === 'year') return `${y}`;
  if (period === 'half') return `${y}-${d.getMonth() < 6 ? 1 : 2}`;
  return `${y}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildBuckets(period: Period, year: number, minYear: number, maxYear: number): Bucket[] {
  const empty = { approved: 0, invoiced: 0, approvedCount: 0, invoicedCount: 0 };
  if (period === 'month') {
    return Array.from({ length: 12 }, (_, i) => ({
      key: `${year}-${String(i + 1).padStart(2, '0')}`, label: `${i + 1}月`, ...empty,
    }));
  }
  const buckets: Bucket[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    if (period === 'year') buckets.push({ key: `${y}`, label: `${y}年`, ...empty });
    else {
      buckets.push({ key: `${y}-1`, label: `${y} 上期`, ...empty });
      buckets.push({ key: `${y}-2`, label: `${y} 下期`, ...empty });
    }
  }
  return buckets;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; year?: string }>;
}) {
  const q = await searchParams;
  const period: Period = q.period === 'half' || q.period === 'year' ? q.period : 'month';
  const thisYear = new Date().getFullYear();

  const [estimates, invoices] = await Promise.all([
    prisma.estimate.findMany({
      where: { status: { in: ['APPROVED', 'INVOICED'] } },
      select: { issueDate: true, totalAmount: true },
    }),
    prisma.invoice.findMany({
      where: { status: { not: 'DRAFT' } },
      select: { issueDate: true, totalAmount: true },
    }),
  ]);

  const years = [...estimates, ...invoices].map((r) => r.issueDate.getFullYear());
  const minYear = Math.min(thisYear, ...years);
  const maxYear = Math.max(thisYear, ...years);
  const year = Math.min(maxYear, Math.max(minYear, Number(q.year) || thisYear));

  const buckets = buildBuckets(period, year, minYear, maxYear);
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const e of estimates) {
    const b = byKey.get(bucketKey(e.issueDate, period));
    if (b) { b.approved += e.totalAmount; b.approvedCount++; }
  }
  for (const inv of invoices) {
    const b = byKey.get(bucketKey(inv.issueDate, period));
    if (b) { b.invoiced += inv.totalAmount; b.invoicedCount++; }
  }

  const total = buckets.reduce(
    (t, b) => ({
      approved: t.approved + b.approved, invoiced: t.invoiced + b.invoiced,
      approvedCount: t.approvedCount + b.approvedCount, invoicedCount: t.invoicedCount + b.invoicedCount,
    }),
    { approved: 0, invoiced: 0, approvedCount: 0, invoicedCount: 0 },
  );

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const periodLabel = period === 'month' ? `${year}年` : `${minYear}〜${maxYear}年`;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* 集計単位・年の切り替え */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/sales?period=${p.value}${p.value === 'month' ? `&year=${year}` : ''}`}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded whitespace-nowrap',
                period === p.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
        {period === 'month' && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {yearOptions.map((y) => (
              <Link
                key={y}
                href={`/sales?period=month&year=${y}`}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md whitespace-nowrap',
                  y === year ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {y}年
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 合計 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-1">見積承認金額（{periodLabel}）</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(total.approved)}</p>
          <p className="text-xs text-gray-400 mt-1">{total.approvedCount}件</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-1">請求金額（{periodLabel}）</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(total.invoiced)}</p>
          <p className="text-xs text-gray-400 mt-1">{total.invoicedCount}件</p>
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
        <h3 className="font-medium text-gray-900 mb-3">
          {PERIODS.find((p) => p.value === period)!.label}の推移
        </h3>
        <SalesChart data={buckets.map(({ label, approved, invoiced }) => ({ label, approved, invoiced }))} />
      </div>

      {/* 表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">期間</th>
              <th className="whitespace-nowrap text-right px-4 py-3 font-medium text-gray-600">見積承認金額</th>
              <th className="whitespace-nowrap text-right px-4 py-3 font-medium text-gray-600">件数</th>
              <th className="whitespace-nowrap text-right px-4 py-3 font-medium text-gray-600">請求金額</th>
              <th className="whitespace-nowrap text-right px-4 py-3 font-medium text-gray-600">件数</th>
            </tr>
          </thead>
          <tbody>
            {[...buckets].reverse().map((b) => (
              <tr key={b.key} className="border-b border-gray-100">
                <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                  {period === 'month' ? `${year}年${b.label}` : b.label}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">{b.approved ? formatCurrency(b.approved) : '-'}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-500">{b.approvedCount || '-'}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">{b.invoiced ? formatCurrency(b.invoiced) : '-'}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-gray-500">{b.invoicedCount || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-medium">
              <td className="whitespace-nowrap px-4 py-3">合計</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{formatCurrency(total.approved)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-gray-500">{total.approvedCount}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{formatCurrency(total.invoiced)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-gray-500">{total.invoicedCount}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        ※ 金額は税込。見積承認金額は「承認済み」「請求済み」の見積書、請求金額は下書き以外の請求書を、それぞれ発行日で集計しています。半期は 1〜6月を上期、7〜12月を下期としています。
      </p>
    </div>
  );
}
