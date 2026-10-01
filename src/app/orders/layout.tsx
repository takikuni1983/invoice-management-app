import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import DocSideList from '@/components/documents/DocSideList';

// 詳細画面（PC）: 左に発注請書の一覧、右に詳細。[id] の外に置くことで、書類を移動しても一覧（検索語・スクロール位置）が残る
// 一覧画面・新規作成・編集では DocSideList 側で非表示にする
export default async function OrderDetailLayout({ children }: { children: React.ReactNode }) {
  const rows = await prisma.orderAcceptance.findMany({
    select: {
      id: true, orderNumber: true, subject: true, status: true, totalAmount: true, orderDate: true,
      customer: { select: { companyName: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return (
    <div className="flex gap-6 items-start">
      <DocSideList
        title="発注請書"
        basePath="/orders"
        badgeType="order"
        items={rows.map((r) => ({
          id: r.id,
          number: r.orderNumber,
          customerName: r.customer.companyName,
          subject: r.subject,
          total: r.totalAmount,
          status: r.status,
          date: formatDate(r.orderDate.toISOString()),
        }))}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
