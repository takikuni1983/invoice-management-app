import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, customers] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.customer.findMany({ orderBy: { companyName: 'asc' } }),
  ]);

  if (!invoice) notFound();

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">請求書を編集</h2>
      <InvoiceForm invoice={invoice as any} customers={customers as any} />
    </div>
  );
}
