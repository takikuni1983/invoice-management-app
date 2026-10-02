import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import DuplicateButton from '@/components/ui/DuplicateButton';
import DocumentPreview from '@/components/documents/DocumentPreview';
import { format } from 'date-fns';
import MarkPaidButton from '@/components/invoices/MarkPaidButton';
import { Edit, Download, Truck } from 'lucide-react';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [invoice, companyInfo] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
        deliveryNotes: { select: { id: true, deliveryNumber: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!invoice) notFound();

  return (
    <div className="max-w-[794px] space-y-4">
      {/* アクションバー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-medium text-gray-900">{invoice.invoiceNumber}</h2>
          <StatusBadge status={invoice.status} type="invoice" />
          {invoice.deliveryNotes.map((d) => (
            <Link key={d.id} href={`/delivery-notes/${d.id}`} className="text-xs text-gray-500 hover:underline">
              納品書: {d.deliveryNumber}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" /> 編集
          </Link>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          <DuplicateButton basePath="/invoices" id={invoice.id} />
          <Link
            href={`/delivery-notes/new?invoiceId=${invoice.id}`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Truck className="h-4 w-4" /> 納品書を作成
          </Link>
          {invoice.status !== 'PAID' && (
            <MarkPaidButton invoiceId={invoice.id} />
          )}
          <DeleteButton id={invoice.id} type="invoices" redirectTo="/invoices" />
        </div>
      </div>

      <DocumentPreview
        title="請求書"
        docNumber={invoice.invoiceNumber}
        dateText={format(invoice.issueDate, 'yyyy/MM/dd')}
        toLabel="請求先"
        customerName={invoice.customer.companyName}
        infoRows={[
          { label: '支払期限', value: invoice.dueDate ? format(invoice.dueDate, 'yyyy/MM/dd') : null },
          // 入金日は画面だけに表示（PDF には出さない）
          { label: '入金日', value: invoice.paidAt ? format(invoice.paidAt, 'yyyy/MM/dd') : null, valueClassName: 'text-green-600' },
          { label: '件名', value: invoice.subject },
          ...invoice.customFields.map(f => ({ label: f.label, value: f.value })),
        ]}
        totalLabel="総額"
        itemHeader="項目 & 詳細"
        showTaxColumn
        lineItems={invoice.lineItems}
        subtotal={invoice.subtotal}
        taxAmount={invoice.taxAmount}
        discount={invoice.discount ?? 0}
        total={invoice.totalAmount}
        sections={[
          // 振込先は 設定 > 自社情報 のものを全請求書に表示
          { label: '振込先', text: companyInfo?.bankInfo, variant: 'bank' },
          { label: '備考', text: invoice.notes, variant: 'text' },
          { label: '取引条件', text: invoice.terms, variant: 'text' },
        ]}
        companyInfo={companyInfo}
      />
    </div>
  );
}
