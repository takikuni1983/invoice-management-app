import { prisma } from '@/lib/db';
import { nextNumber } from '@/lib/numbering';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const [customers, suggestedNumber] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
    nextNumber(prisma, 'invoice'),
  ]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">請求書を新規作成</h2>
      <InvoiceForm
        suggestedNumber={suggestedNumber}
        customers={customers as any}
        defaultCustomerId={customerId ? Number(customerId) : undefined}
      />
    </div>
  );
}
