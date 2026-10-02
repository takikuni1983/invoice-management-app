import { prisma } from '@/lib/db';
import { parseSort } from '@/lib/sort';
import DocumentList, { DOCUMENT_SORT_KEYS } from '@/components/documents/DocumentList';

const STATUS_TABS = [
  { value: '', label: 'すべて' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送付済み' },
  { value: 'PAID', label: '入金済み' },
  { value: 'OVERDUE', label: '期限超過' },
];

const SORT_KEYS = [...DOCUMENT_SORT_KEYS, 'issueDate', 'dueDate'] as const;

export default async function InvoicesPage({
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
    number: { invoiceNumber: sort.dir },
    customer: { customer: { companyName: sort.dir } },
    subject: { subject: sort.dir },
    status: { status: sort.dir },
    total: { totalAmount: sort.dir },
    issueDate: { issueDate: sort.dir },
    dueDate: { dueDate: sort.dir },
  }[sort.key ?? ''] ?? { createdAt: 'desc' as const };

  // 支払期限を過ぎた送付済みの請求書を「期限超過」にする
  await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customer ? { customerId: customer.id } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: [orderBy, { id: 'desc' }],
  });

  return (
    <DocumentList
      basePath="/invoices"
      deleteType="invoices"
      badgeType="invoice"
      numberLabel="請求番号"
      newLabel="新規請求書"
      searchPlaceholder="請求番号・件名・顧客名"
      emptyMessage="請求書がありません"
      statusTabs={STATUS_TABS}
      dateColumns={[{ key: 'issueDate', label: '発行日' }, { key: 'dueDate', label: '支払期限' }]}
      rows={invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoiceNumber,
        customerName: inv.customer.companyName,
        subject: inv.subject,
        status: inv.status,
        dates: [inv.issueDate, inv.dueDate],
        total: inv.totalAmount,
      }))}
      status={status}
      search={search}
      sort={sort}
      customer={customer ? { id: customer.id, name: customer.companyName } : null}
    />
  );
}
