import { prisma } from '@/lib/db';
import { parseSort } from '@/lib/sort';
import DocumentList, { DOCUMENT_SORT_KEYS } from '@/components/documents/DocumentList';

const STATUS_TABS = [
  { value: '', label: 'すべて' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送付済み' },
];

const SORT_KEYS = [...DOCUMENT_SORT_KEYS, 'orderDate'] as const;

export default async function OrdersPage({
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
    number: { orderNumber: sort.dir },
    customer: { customer: { companyName: sort.dir } },
    subject: { subject: sort.dir },
    status: { status: sort.dir },
    total: { totalAmount: sort.dir },
    orderDate: { orderDate: sort.dir },
  }[sort.key ?? ''] ?? { createdAt: 'desc' as const };

  const orders = await prisma.orderAcceptance.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customer ? { customerId: customer.id } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true, estimate: { select: { id: true, estimateNumber: true } } },
    orderBy: [orderBy, { id: 'desc' }],
  });

  return (
    <DocumentList
      basePath="/orders"
      deleteType="orders"
      badgeType="order"
      numberLabel="番号"
      newLabel="新規発注請書"
      searchPlaceholder="番号・案件名・顧客名"
      emptyMessage="発注請書がありません（見積書の詳細画面から作成できます）"
      statusTabs={STATUS_TABS}
      dateColumns={[{ key: 'orderDate', label: '発注日' }]}
      sourceLabel="元見積"
      rows={orders.map((o) => ({
        id: o.id,
        number: o.orderNumber,
        customerName: o.customer.companyName,
        subject: o.subject,
        status: o.status,
        dates: [o.orderDate],
        total: o.totalAmount,
        source: o.estimate ? { href: `/estimates/${o.estimate.id}`, label: o.estimate.estimateNumber } : null,
      }))}
      status={status}
      search={search}
      sort={sort}
      customer={customer ? { id: customer.id, name: customer.companyName } : null}
    />
  );
}
