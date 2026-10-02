import { prisma } from '@/lib/db';
import { parseSort } from '@/lib/sort';
import DocumentList, { DOCUMENT_SORT_KEYS } from '@/components/documents/DocumentList';

const STATUS_TABS = [
  { value: '', label: 'すべて' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送信済み' },
  { value: 'APPROVED', label: '承認済み' },
  { value: 'INVOICED', label: '請求済み' },
];

const SORT_KEYS = [...DOCUMENT_SORT_KEYS, 'issueDate'] as const;

export default async function EstimatesPage({
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
    number: { estimateNumber: sort.dir },
    customer: { customer: { companyName: sort.dir } },
    subject: { subject: sort.dir },
    status: { status: sort.dir },
    total: { totalAmount: sort.dir },
    issueDate: { issueDate: sort.dir },
  }[sort.key ?? ''] ?? { createdAt: 'desc' as const };

  const estimates = await prisma.estimate.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customer ? { customerId: customer.id } : {}),
      ...(search
        ? {
            OR: [
              { estimateNumber: { contains: search } },
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
      basePath="/estimates"
      deleteType="estimates"
      badgeType="estimate"
      numberLabel="見積番号"
      newLabel="新規見積書"
      searchPlaceholder="見積番号・件名・顧客名"
      emptyMessage="見積書がありません"
      statusTabs={STATUS_TABS}
      dateColumns={[{ key: 'issueDate', label: '発行日' }]}
      rows={estimates.map((e) => ({
        id: e.id,
        number: e.estimateNumber,
        customerName: e.customer.companyName,
        subject: e.subject,
        status: e.status,
        dates: [e.issueDate],
        total: e.totalAmount,
      }))}
      status={status}
      search={search}
      sort={sort}
      customer={customer ? { id: customer.id, name: customer.companyName } : null}
    />
  );
}
