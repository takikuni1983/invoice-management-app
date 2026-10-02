import { prisma } from '@/lib/db';
import { nextNumber } from '@/lib/numbering';
import { duplicateId, duplicateOrder } from '@/lib/duplicate';
import OrderForm, { OrderFormInitial } from '@/components/orders/OrderForm';

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; estimateId?: string; duplicate?: string }>;
}) {
  const { customerId, estimateId, duplicate } = await searchParams;
  const dupId = duplicateId(duplicate);

  const [customers, estimate, suggestedNumber, dup] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
    estimateId
      ? prisma.estimate.findUnique({
          where: { id: Number(estimateId) },
          include: {
            lineItems: { orderBy: { sortOrder: 'asc' } },
            customFields: { orderBy: { sortOrder: 'asc' } },
          },
        })
      : null,
    nextNumber(prisma, 'order'),
    dupId ? duplicateOrder(dupId) : null,
  ]);

  // 複製（?duplicate=）なら元の書類、見積書から作成なら見積書の内容を初期値にする
  const initial: OrderFormInitial | undefined = dup
    ? (dup.initial as any)
    : estimate
    ? {
        estimateId: estimate.id,
        customerId: estimate.customerId,
        subject: estimate.subject,
        paymentTerms: estimate.terms,
        notes: estimate.notes,
        discount: estimate.discount,
        lineItems: estimate.lineItems,
        customFields: estimate.customFields,
      }
    : undefined;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{dup ? '発注請書を複製して作成' : '発注請書を新規作成'}</h2>
      {dup ? (
        <p className="text-sm text-gray-500 mb-6">
          {dup.source} の内容をコピーしています。番号は空欄のまま保存すると自動で振られます。
        </p>
      ) : estimate ? (
        <p className="text-sm text-gray-500 mb-6">
          見積書 {estimate.estimateNumber} の内容を引き継いでいます。納期・納入場所などを確認して保存してください。
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <OrderForm
        suggestedNumber={suggestedNumber}
        order={initial}
        customers={customers as any}
        defaultCustomerId={customerId ? Number(customerId) : undefined}
      />
    </div>
  );
}
