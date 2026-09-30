import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Plus } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';

const STATUS_TABS = [
  { value: '', label: 'すべて' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送信済み' },
  { value: 'APPROVED', label: '承認済み' },
  { value: 'INVOICED', label: '請求済み' },
];

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status = '', search = '' } = await searchParams;

  const estimates = await prisma.estimate.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { estimateNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <form className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="見積番号・件名・顧客名"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>
        <Link
          href="/estimates/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新規見積書
        </Link>
      </div>

      {/* ステータスタブ */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/estimates?status=${tab.value}${search ? `&search=${search}` : ''}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              status === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">見積番号</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">顧客名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">件名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">発行日</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">金額</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {estimates.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  見積書がありません
                </td>
              </tr>
            ) : (
              estimates.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/estimates/${e.id}`} className="text-blue-600 hover:underline font-medium">
                      {e.estimateNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.customer.companyName}</td>
                  <td className="px-4 py-3 text-gray-600">{e.subject || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} type="estimate" />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(e.issueDate.toISOString())}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/estimates/${e.id}/edit`}
                        className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                      >
                        編集
                      </Link>
                      <DeleteButton id={e.id} type="estimates" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
