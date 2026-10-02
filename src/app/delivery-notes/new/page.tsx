import { prisma } from '@/lib/db';
import { nextNumber } from '@/lib/numbering';
import { duplicateId, duplicateDeliveryNote } from '@/lib/duplicate';
import DeliveryNoteForm, { DeliveryNoteFormInitial } from '@/components/delivery-notes/DeliveryNoteForm';

export default async function NewDeliveryNotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; invoiceId?: string; duplicate?: string }>;
}) {
  const { customerId, invoiceId, duplicate } = await searchParams;
  const dupId = duplicateId(duplicate);

  const [customers, invoice, suggestedNumber, dup] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
    invoiceId
      ? prisma.invoice.findUnique({
          where: { id: Number(invoiceId) },
          include: {
            lineItems: { orderBy: { sortOrder: 'asc' } },
            customFields: { orderBy: { sortOrder: 'asc' } },
          },
        })
      : null,
    nextNumber(prisma, 'delivery'),
    dupId ? duplicateDeliveryNote(dupId) : null,
  ]);

  // 複製（?duplicate=）なら元の書類、請求書から作成なら請求書の内容を初期値にする
  const initial: DeliveryNoteFormInitial | undefined = dup
    ? (dup.initial as any)
    : invoice
    ? {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        subject: invoice.subject,
        notes: invoice.notes,
        discount: invoice.discount,
        lineItems: invoice.lineItems,
        customFields: invoice.customFields,
      }
    : undefined;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{dup ? '納品書を複製して作成' : '納品書を新規作成'}</h2>
      {dup ? (
        <p className="text-sm text-gray-500 mb-6">
          {dup.source} の内容をコピーしています。番号は空欄のまま保存すると自動で振られます。
        </p>
      ) : invoice ? (
        <p className="text-sm text-gray-500 mb-6">
          請求書 {invoice.invoiceNumber} の内容を引き継いでいます。納品日・納入形式などを確認して保存してください。
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <DeliveryNoteForm
        suggestedNumber={suggestedNumber}
        note={initial}
        customers={customers as any}
        defaultCustomerId={customerId ? Number(customerId) : undefined}
      />
    </div>
  );
}
