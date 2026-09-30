import { prisma } from '@/lib/db';
import { nextNumber } from '@/lib/numbering';
import EstimateForm from '@/components/estimates/EstimateForm';

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const [customers, suggestedNumber] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
    nextNumber(prisma, 'estimate'),
  ]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">見積書を新規作成</h2>
      <EstimateForm
        suggestedNumber={suggestedNumber}
        customers={customers as any}
        defaultCustomerId={customerId ? Number(customerId) : undefined}
      />
    </div>
  );
}
