import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import DocSideList from '@/components/documents/DocSideList';

// 詳細画面（PC）: 左に請求書の一覧、右に詳細。[id] の外に置くことで、書類を移動しても一覧（検索語・スクロール位置）が残る
// 一覧画面・新規作成・編集では DocSideList 側で非表示にする
export default async function InvoiceDetailLayout({ children }: { children: React.ReactNode }) {
  const rows = await prisma.invoice.findMany({
    select: {
      id: true, invoiceNumber: true, subject: true, status: true, totalAmount: true, issueDate: true,
      customer: { select: { companyName: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return (
    <div className="flex gap-6 items-start">
      <DocSideList
        title="請求書"
        basePath="/invoices"
        badgeType="invoice"
        items={rows.map((r) => ({
          id: r.id,
          number: r.invoiceNumber,
          customerName: r.customer.companyName,
          subject: r.subject,
          total: r.totalAmount,
          status: r.status,
          date: formatDate(r.issueDate.toISOString()),
        }))}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
