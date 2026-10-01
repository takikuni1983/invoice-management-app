import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import DocSideList from '@/components/documents/DocSideList';

// 詳細画面（PC）: 左に納品書の一覧、右に詳細。[id] の外に置くことで、書類を移動しても一覧（検索語・スクロール位置）が残る
// 一覧画面・新規作成・編集では DocSideList 側で非表示にする
export default async function DeliveryNoteDetailLayout({ children }: { children: React.ReactNode }) {
  const rows = await prisma.deliveryNote.findMany({
    select: {
      id: true, deliveryNumber: true, subject: true, status: true, totalAmount: true, deliveryDate: true,
      customer: { select: { companyName: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return (
    <div className="flex gap-6 items-start">
      <DocSideList
        title="納品書"
        basePath="/delivery-notes"
        badgeType="delivery"
        items={rows.map((r) => ({
          id: r.id,
          number: r.deliveryNumber,
          customerName: r.customer.companyName,
          subject: r.subject,
          total: r.totalAmount,
          status: r.status,
          date: formatDate(r.deliveryDate.toISOString()),
        }))}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
