import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import DuplicateButton from '@/components/ui/DuplicateButton';
import DocumentPreview from '@/components/documents/DocumentPreview';
import { Edit, Download } from 'lucide-react';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [order, companyInfo] = await Promise.all([
    prisma.orderAcceptance.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        estimate: { select: { id: true, estimateNumber: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!order) notFound();

  return (
    <div className="max-w-[794px] space-y-4">
      {/* アクションバー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-medium text-gray-900">{order.orderNumber}</h2>
          <StatusBadge status={order.status} type="order" />
          {order.estimate && (
            <Link href={`/estimates/${order.estimate.id}`} className="text-xs text-gray-500 hover:underline">
              元見積: {order.estimate.estimateNumber}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/orders/${order.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" /> 編集
          </Link>
          <a
            href={`/api/orders/${order.id}/pdf`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          <DuplicateButton basePath="/orders" id={order.id} />
          <DeleteButton id={order.id} type="orders" redirectTo="/orders" />
        </div>
      </div>

      <DocumentPreview
        title="発注請書"
        docNumber={order.orderNumber}
        dateText={format(order.orderDate, 'yyyy年M月d日')}
        toLabel="送付先"
        customerName={order.customer.companyName}
        customerHref={`/orders?customerId=${order.customerId}`}
        lead="下記の通り発注を承りました。"
        infoRows={[
          { label: '案件名', value: order.subject },
          { label: '納期', value: order.deliveryDate ? format(order.deliveryDate, 'yyyy年M月d日') : null },
          { label: '納入場所', value: order.deliveryPlace },
          { label: '支払条件', value: order.paymentTerms },
          ...order.customFields.map(f => ({ label: f.label, value: f.value })),
        ]}
        totalLabel="発注金額"
        itemHeader="納品物 & 詳細"
        showTaxColumn={false}
        lineItems={order.lineItems}
        subtotal={order.subtotal}
        taxAmount={order.taxAmount}
        discount={order.discount ?? 0}
        total={order.totalAmount}
        sections={[{ label: '備考', text: order.notes, variant: 'text' }]}
        companyInfo={companyInfo}
      />
    </div>
  );
}
