import Link from 'next/link';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import RevenueChart from '@/components/dashboard/RevenueChart';
import { TrendingUp, TrendingDown, AlertCircle, Clock, FileText } from 'lucide-react';

export default async function DashboardPage() {
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

  // Monthly revenue for last 6 months
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const agg = await prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startOfMonth(d), lte: endOfMonth(d) } },
      _sum: { totalAmount: true },
    });
    monthlyRevenue.push({
      month: format(d, 'M月', { locale: ja }),
      amount: agg._sum.totalAmount ?? 0,
    });
  }

  const thisMonthRevenue = thisMonth._sum.totalAmount ?? 0;
  const prevMonthRevenue = prevMonth._sum.totalAmount ?? 0;
  const revenueChange = prevMonthRevenue > 0
    ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
    : 0;
  const revenueUp = thisMonthRevenue >= prevMonthRevenue;

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">今月の売上</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthRevenue)}</p>
          <div className={`flex items-center gap-1 text-xs mt-1 ${revenueUp ? 'text-green-600' : 'text-red-500'}`}>
            {revenueUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>前月比 {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">未払い請求</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(unpaid._sum.totalAmount ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{unpaid._count.id}件</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">期限超過</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(overdue._sum.totalAmount ?? 0)}</p>
          <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{overdue._count.id}件</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">見積書（下書き）</p>
          <p className="text-2xl font-bold text-gray-900">{draftEstimates}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <FileText className="h-3.5 w-3.5" />
            <span>未送付</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 月次売上グラフ */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-medium text-gray-900 mb-4">月次売上 (過去6ヶ月)</h3>
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
        <div className="flex gap-3">
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
