import { prisma } from '@/lib/db';
import { nextNumber } from '@/lib/numbering';
import DeliveryNoteForm, { DeliveryNoteFormInitial } from '@/components/delivery-notes/DeliveryNoteForm';

export default async function NewDeliveryNotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; invoiceId?: string }>;
}) {
  const { customerId, invoiceId } = await searchParams;

  const [customers, invoice, suggestedNumber] = await Promise.all([
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
  ]);

  // 請求書の内容を引き継いで初期値にする
  const initial: DeliveryNoteFormInitial | undefined = invoice
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
      <h2 className="text-lg font-semibold text-gray-900 mb-2">納品書を新規作成</h2>
      {invoice ? (
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
