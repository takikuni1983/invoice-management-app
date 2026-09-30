import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import { Edit } from 'lucide-react';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    include: {
      estimates: { orderBy: { createdAt: 'desc' }, take: 5 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{customer.companyName}</h2>
          <p className="text-sm text-gray-500">{customer.contactName} 様</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" /> 編集
          </Link>
          <DeleteButton id={customer.id} type="customers" redirectTo="/customers" label="削除" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-medium text-gray-900 mb-3 border-b pb-2">連絡先情報</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">メール</dt>
              <dd>{customer.email ?? '-'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-24">電話番号</dt>
              <dd>{customer.phone ?? '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-medium text-gray-900 mb-3 border-b pb-2">住所</h3>
          <p className="text-sm text-gray-700">
            {customer.postalCode && `〒${customer.postalCode} `}
            {customer.prefecture}{customer.city}{customer.addressLine1}
            {customer.addressLine2 && <><br />{customer.addressLine2}</>}
          </p>
        </div>
      </div>

      {/* 見積書一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium text-gray-900">見積書</h3>
          <Link href={`/estimates/new?customerId=${customer.id}`} className="text-sm text-blue-600 hover:underline">
            + 新規作成
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-2 font-medium text-gray-600">番号</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">件名</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">ステータス</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">金額</th>
            </tr>
          </thead>
          <tbody>
            {customer.estimates.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400">見積書がありません</td></tr>
            ) : customer.estimates.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/estimates/${e.id}`} className="text-blue-600 hover:underline">{e.estimateNumber}</Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{e.subject ?? '-'}</td>
                <td className="px-4 py-2"><StatusBadge status={e.status} type="estimate" /></td>
                <td className="px-4 py-2 text-right">{formatCurrency(e.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 請求書一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium text-gray-900">請求書</h3>
          <Link href={`/invoices/new?customerId=${customer.id}`} className="text-sm text-blue-600 hover:underline">
            + 新規作成
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-2 font-medium text-gray-600">番号</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">件名</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">ステータス</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">金額</th>
            </tr>
          </thead>
          <tbody>
            {customer.invoices.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400">請求書がありません</td></tr>
            ) : customer.invoices.map((inv) => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">{inv.invoiceNumber}</Link>
                </td>
                <td className="px-4 py-2 text-gray-600">{inv.subject ?? '-'}</td>
                <td className="px-4 py-2"><StatusBadge status={inv.status} type="invoice" /></td>
                <td className="px-4 py-2 text-right">{formatCurrency(inv.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
