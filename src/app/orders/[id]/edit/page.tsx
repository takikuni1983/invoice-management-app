import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import OrderForm from '@/components/orders/OrderForm';

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, customers] = await Promise.all([
    prisma.orderAcceptance.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
  ]);

  if (!order) notFound();

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">発注請書を編集</h2>
      <OrderForm order={order as any} customers={customers as any} />
    </div>
  );
}
