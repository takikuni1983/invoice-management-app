import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import StatusSelect from '@/components/ui/StatusSelect';
import DeleteButton from '@/components/ui/DeleteButton';
import DuplicateButton from '@/components/ui/DuplicateButton';
import DocumentPreview from '@/components/documents/DocumentPreview';
import { Edit, Download } from 'lucide-react';

export default async function DeliveryNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [note, companyInfo] = await Promise.all([
    prisma.deliveryNote.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        invoice: { select: { id: true, invoiceNumber: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!note) notFound();

  return (
    <div className="max-w-[794px] space-y-4">
      {/* アクションバー */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-medium text-gray-900">{note.deliveryNumber}</h2>
          <StatusSelect id={note.id} status={note.status} type="delivery" />
          {note.invoice && (
            <Link href={`/invoices/${note.invoice.id}`} className="text-xs text-gray-500 hover:underline">
              元請求: {note.invoice.invoiceNumber}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/delivery-notes/${note.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" /> 編集
          </Link>
          <a
            href={`/api/delivery-notes/${note.id}/pdf`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          <DuplicateButton basePath="/delivery-notes" id={note.id} />
          <DeleteButton id={note.id} type="delivery-notes" redirectTo="/delivery-notes" />
        </div>
      </div>

      <DocumentPreview
        title="納品書"
        docNumber={note.deliveryNumber}
        dateText={format(note.deliveryDate, 'yyyy年M月d日')}
        toLabel="送付先"
        customerName={note.customer.companyName}
        customerHref={`/delivery-notes?customerId=${note.customerId}`}
        lead="下記の通り納品致します。"
        infoRows={[
          { label: '案件名', value: note.subject },
          { label: '納品日', value: format(note.deliveryDate, 'yyyy年M月d日') },
          { label: '納入形式', value: note.deliveryFormat },
          ...note.customFields.map(f => ({ label: f.label, value: f.value })),
        ]}
        totalLabel="納品金額"
        itemHeader="納品物 & 詳細"
        showTaxColumn={false}
        lineItems={note.lineItems}
        subtotal={note.subtotal}
        taxAmount={note.taxAmount}
        discount={note.discount ?? 0}
        total={note.totalAmount}
        sections={[{ label: '備考', text: note.notes, variant: 'text' }]}
        companyInfo={companyInfo}
      />
    </div>
  );
}
