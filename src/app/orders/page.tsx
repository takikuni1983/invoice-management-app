import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';

const STATUS_TABS = [
  { value: '', label: 'すべて' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送付済み' },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status = '', search = '' } = await searchParams;

  const orders = await prisma.orderAcceptance.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true, estimate: { select: { id: true, estimateNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form className="flex gap-2 flex-1 sm:flex-none">
          <input
            name="search"
            defaultValue={search}
            placeholder="番号・案件名・顧客名"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <Link
          href="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新規発注請書
        </Link>
      </div>

      {/* ステータスタブ */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/orders?status=${tab.value}${search ? `&search=${search}` : ''}`}
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

      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">番号</th>
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">顧客名</th>
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">案件名</th>
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">元見積</th>
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
              <th className="whitespace-nowrap text-left px-4 py-3 font-medium text-gray-600">発注日</th>
              <th className="whitespace-nowrap text-right px-4 py-3 font-medium text-gray-600">金額</th>
              <th className="whitespace-nowrap px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  発注請書がありません（見積書の詳細画面から作成できます）
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline font-medium">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{o.customer.companyName}</td>
                  <td className="px-4 py-3 text-gray-600">{o.subject || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {o.estimate ? (
                      <Link href={`/estimates/${o.estimate.id}`} className="hover:underline">
                        {o.estimate.estimateNumber}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={o.status} type="order" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{formatDate(o.orderDate.toISOString())}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/orders/${o.id}/edit`}
                        className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                      >
                        編集
                      </Link>
                      <DeleteButton id={o.id} type="orders" />
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
        {orders.length === 0 ? (
          <p className="bg-white rounded-lg border border-gray-200 text-center py-10 text-sm text-gray-400">発注請書がありません</p>
        ) : (
          orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{o.orderNumber}</p>
                  <p className="font-medium text-gray-900 truncate">{o.customer.companyName}</p>
                  <p className="text-sm text-gray-600 truncate">{o.subject || '-'}</p>
                </div>
                <StatusBadge status={o.status} type="order" />
              </div>
              <div className="flex items-end justify-between mt-2">
                <p className="text-xs text-gray-500">発注日 {formatDate(o.orderDate.toISOString())}</p>
                <p className="font-medium">{formatCurrency(o.totalAmount)}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
