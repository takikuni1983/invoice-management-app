import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import DeliveryNoteForm from '@/components/delivery-notes/DeliveryNoteForm';

export default async function EditDeliveryNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [note, customers] = await Promise.all([
    prisma.deliveryNote.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
  ]);

  if (!note) notFound();

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">納品書を編集</h2>
      <DeliveryNoteForm note={note as any} customers={customers as any} />
    </div>
  );
}
