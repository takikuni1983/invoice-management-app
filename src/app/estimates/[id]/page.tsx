import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import DocumentPreview from '@/components/documents/DocumentPreview';
import { format } from 'date-fns';
import ConvertToInvoiceButton from '@/components/estimates/ConvertToInvoiceButton';
import { Edit, Download, ClipboardCheck } from 'lucide-react';

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [estimate, companyInfo] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
        orderAcceptances: { select: { id: true, orderNumber: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!estimate) notFound();

  return (
    <div className="max-w-[794px] space-y-4">
      {/* アクションバー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-medium text-gray-900">{estimate.estimateNumber}</h2>
          <StatusBadge status={estimate.status} type="estimate" />
          {estimate.orderAcceptances.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="text-xs text-gray-500 hover:underline">
              発注請書: {o.orderNumber}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/estimates/${estimate.id}/pdf`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          <Link
            href={`/orders/new?estimateId=${estimate.id}`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <ClipboardCheck className="h-4 w-4" /> 発注請書を作成
          </Link>
          {estimate.status !== 'INVOICED' && (
            <ConvertToInvoiceButton estimateId={estimate.id} />
          )}
          <Link
            href={`/estimates/${estimate.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" /> 編集
          </Link>
          <DeleteButton id={estimate.id} type="estimates" redirectTo="/estimates" />
        </div>
      </div>

      <DocumentPreview
        title="見積書"
        docNumber={estimate.estimateNumber}
        dateText={format(estimate.issueDate, 'yyyy/MM/dd')}
        toLabel="送付先"
        customerName={estimate.customer.companyName}
        infoRows={[
          { label: '有効期限', value: estimate.expiryDate ? format(estimate.expiryDate, 'yyyy/MM/dd') : null },
          { label: '件名', value: estimate.subject },
          ...estimate.customFields.map(f => ({ label: f.label, value: f.value })),
        ]}
        totalLabel="総額"
        itemHeader="項目 & 詳細"
        showTaxColumn
        lineItems={estimate.lineItems}
        subtotal={estimate.subtotal}
        taxAmount={estimate.taxAmount}
        discount={estimate.discount ?? 0}
        total={estimate.totalAmount}
        sections={[
          { label: '備考', text: estimate.notes, variant: 'note' },
          { label: '取引条件', text: estimate.terms, variant: 'plain' },
        ]}
        companyInfo={companyInfo}
      />
    </div>
  );
}
