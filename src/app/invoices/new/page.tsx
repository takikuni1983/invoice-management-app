import { prisma } from '@/lib/db';
import { nextNumber } from '@/lib/numbering';
import { duplicateId, duplicateInvoice } from '@/lib/duplicate';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; duplicate?: string }>;
}) {
  const { customerId, duplicate } = await searchParams;
  const dupId = duplicateId(duplicate);
  const [customers, suggestedNumber, dup] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
    nextNumber(prisma, 'invoice'),
    dupId ? duplicateInvoice(dupId) : null,
  ]);

  return (
    <div>
      <h2 className={`text-lg font-semibold text-gray-900 ${dup ? 'mb-2' : 'mb-6'}`}>{dup ? '請求書を複製して作成' : '請求書を新規作成'}</h2>
      {dup && (
        <p className="text-sm text-gray-500 mb-6">
          {dup.source} の内容をコピーしています。番号は空欄のまま保存すると自動で振られます。
        </p>
      )}
      <InvoiceForm
        suggestedNumber={suggestedNumber}
        invoice={dup?.initial as any}
        customers={customers as any}
        defaultCustomerId={customerId ? Number(customerId) : undefined}
      />
    </div>
  );
}
