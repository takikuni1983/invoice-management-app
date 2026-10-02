import { prisma } from '@/lib/db';
import { parseSort } from '@/lib/sort';
import DocumentList, { DOCUMENT_SORT_KEYS } from '@/components/documents/DocumentList';

const STATUS_TABS = [
  { value: '', label: 'すべて' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送付済み' },
];

const SORT_KEYS = [...DOCUMENT_SORT_KEYS, 'deliveryDate'] as const;

export default async function DeliveryNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; sort?: string; dir?: string; customerId?: string }>;
}) {
  const { status = '', search = '', ...q } = await searchParams;
  const sort = parseSort(q.sort, q.dir, SORT_KEYS);
  // 詳細画面の顧客名リンクから来たときは、その顧客の書類だけを表示
  const customerId = Number(q.customerId) > 0 ? Number(q.customerId) : null;
  const customer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, companyName: true } })
    : null;
  const orderBy = {
    number: { deliveryNumber: sort.dir },
    customer: { customer: { companyName: sort.dir } },
    subject: { subject: sort.dir },
    status: { status: sort.dir },
    total: { totalAmount: sort.dir },
    deliveryDate: { deliveryDate: sort.dir },
  }[sort.key ?? ''] ?? { createdAt: 'desc' as const };

  const notes = await prisma.deliveryNote.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customer ? { customerId: customer.id } : {}),
      ...(search
        ? {
            OR: [
              { deliveryNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true, invoice: { select: { id: true, invoiceNumber: true } } },
    orderBy: [orderBy, { id: 'desc' }],
  });

  return (
    <DocumentList
      basePath="/delivery-notes"
      deleteType="delivery-notes"
      badgeType="delivery"
      numberLabel="番号"
      newLabel="新規納品書"
      searchPlaceholder="番号・案件名・顧客名"
      emptyMessage="納品書がありません（請求書の詳細画面から作成できます）"
      statusTabs={STATUS_TABS}
      dateColumns={[{ key: 'deliveryDate', label: '納品日' }]}
      sourceLabel="元請求"
      rows={notes.map((o) => ({
        id: o.id,
        number: o.deliveryNumber,
        customerName: o.customer.companyName,
        subject: o.subject,
        status: o.status,
        dates: [o.deliveryDate],
        total: o.totalAmount,
        source: o.invoice ? { href: `/invoices/${o.invoice.id}`, label: o.invoice.invoiceNumber } : null,
      }))}
      status={status}
      search={search}
      sort={sort}
      customer={customer ? { id: customer.id, name: customer.companyName } : null}
    />
  );
}
