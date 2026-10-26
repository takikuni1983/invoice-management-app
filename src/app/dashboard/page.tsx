import Link from 'next/link';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import RevenueChart from '@/components/dashboard/RevenueChart';
import { TrendingUp, TrendingDown, AlertCircle, Clock, FileText } from 'lucide-react';

// 月次売上グラフの期間（初期値: 今年）
const RANGES = [
  { value: '6m', label: '6カ月' },
  { value: '12m', label: '12カ月' },
  { value: 'thisYear', label: '今年' },
  { value: 'lastYear', label: '昨年' },
] as const;
type Range = (typeof RANGES)[number]['value'];

/** グラフに並べる月（古い順） */
function rangeMonths(range: Range, now: Date): Date[] {
  if (range === '6m' || range === '12m') {
    const n = range === '6m' ? 6 : 12;
    return Array.from({ length: n }, (_, i) => startOfMonth(subMonths(now, n - 1 - i)));
  }
  const year = now.getFullYear() - (range === 'lastYear' ? 1 : 0);
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: Range = RANGES.some(r => r.value === rangeParam) ? (rangeParam as Range) : 'thisYear';
  const now = new Date();
  const startThis = startOfMonth(now);
  const endThis = endOfMonth(now);
  const startPrev = startOfMonth(subMonths(now, 1));
  const endPrev = endOfMonth(subMonths(now, 1));

  // Auto-mark overdue
  await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: now } },
    data: { status: 'OVERDUE' },
  });

  const [thisMonth, prevMonth, unpaid, overdue, draftEstimates, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startThis, lte: endThis } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startPrev, lte: endPrev } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'SENT' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.estimate.count({ where: { status: 'DRAFT' } }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    }),
  ]);

  // 月次売上（入金済みの請求書を入金日で集計）: 期間内をまとめて取得して月ごとに合計
  const months = rangeMonths(range, now);
  const paidInRange = await prisma.invoice.findMany({
    where: { status: 'PAID', paidAt: { gte: months[0], lte: endOfMonth(months[months.length - 1]) } },
    select: { paidAt: true, totalAmount: true },
  });
  const byMonth = new Map<string, number>();
  for (const inv of paidInRange) {
    const key = format(inv.paidAt!, 'yyyy-MM');
    byMonth.set(key, (byMonth.get(key) ?? 0) + inv.totalAmount);
  }
  const rolling = range === '6m' || range === '12m';
  const monthlyRevenue = months.map((d, i) => ({
    // 年をまたぐ期間は先頭の月と1月に年を付ける
    month: rolling && (i === 0 || d.getMonth() === 0) ? format(d, 'yy年M月', { locale: ja }) : format(d, 'M月', { locale: ja }),
    amount: byMonth.get(format(d, 'yyyy-MM')) ?? 0,
  }));
  const rangeTotal = monthlyRevenue.reduce((sum, m) => sum + m.amount, 0);
  const rangeTitle =
    range === 'thisYear' ? `${now.getFullYear()}年`
    : range === 'lastYear' ? `${now.getFullYear() - 1}年`
    : `過去${range === '6m' ? 6 : 12}カ月`;

  const thisMonthRevenue = thisMonth._sum.totalAmount ?? 0;
  const prevMonthRevenue = prevMonth._sum.totalAmount ?? 0;
  const revenueChange = prevMonthRevenue > 0
    ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : 0;
  const revenueUp = thisMonthRevenue >= prevMonthRevenue;

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-1">今月の売上</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(thisMonthRevenue)}</p>
          <div className={`flex items-center gap-1 text-xs mt-1 ${revenueUp ? 'text-green-600' : 'text-red-500'}`}>
            {revenueUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>前月比 {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-1">未払い請求</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(unpaid._sum.totalAmount ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{unpaid._count.id}件</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-1">期限超過</p>
          <p className="text-lg md:text-2xl font-bold text-red-600">{formatCurrency(overdue._sum.totalAmount ?? 0)}</p>
          <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{overdue._count.id}件</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-1">見積書（下書き）</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{draftEstimates}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <FileText className="h-3.5 w-3.5" />
            <span>未送付</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* 月次売上グラフ */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="font-medium text-gray-900">月次売上（{rangeTitle}）</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                合計 <span className="font-medium text-gray-900">{formatCurrency(rangeTotal)}</span>（入金済みの請求書・入金日で集計）
              </p>
            </div>
            <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
              {RANGES.map((r) => (
                <Link
                  key={r.value}
                  href={`/dashboard?range=${r.value}`}
                  scroll={false}
                  className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
                    range === r.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
          <RevenueChart data={monthlyRevenue} />
        </div>

        {/* 最近の請求書 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">最近の請求書</h3>
            <Link href="/invoices" className="text-xs text-blue-600 hover:underline">すべて表示</Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">請求書がありません</p>
            ) : recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-blue-600 hover:underline block truncate">
                    {inv.invoiceNumber}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{inv.customer.companyName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</p>
                  <StatusBadge status={inv.status} type="invoice" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-medium text-gray-900 mb-3">クイックアクション</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/estimates/new" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100">
            <FileText className="h-4 w-4" /> 見積書を作成
          </Link>
          <Link href="/invoices/new" className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-md hover:bg-green-100">
            <Clock className="h-4 w-4" /> 請求書を作成
          </Link>
          <Link href="/customers/new" className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100">
            + 顧客を登録
          </Link>
        </div>
      </div>
    </div>
  );
}
