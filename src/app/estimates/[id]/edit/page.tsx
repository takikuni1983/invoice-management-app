import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EstimateForm from '@/components/estimates/EstimateForm';

export default async function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [estimate, customers] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
  ]);

  if (!estimate) notFound();

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">見積書を編集</h2>
      <EstimateForm estimate={estimate as any} customers={customers as any} />
    </div>
  );
}
