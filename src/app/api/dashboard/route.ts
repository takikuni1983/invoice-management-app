import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DB を毎回読む（本番ビルドで静的化されて PUT/POST が 405 になるのを防ぐ）
export const dynamic = 'force-dynamic';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ja } from 'date-fns/locale';

export async function GET() {
  const now = new Date();
  const startThis = startOfMonth(now);
  const endThis = endOfMonth(now);
  const startPrev = startOfMonth(subMonths(now, 1));
  const endPrev = endOfMonth(subMonths(now, 1));

  // Auto-mark overdue
  await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: now } },
    data: { status: 'OVERDUE' },
  });

  const [thisMonth, prevMonth, unpaid, overdue, draftEstimates, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startThis, lte: endThis } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startPrev, lte: endPrev } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'SENT' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.estimate.count({ where: { status: 'DRAFT' } }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    }),
  ]);

  // Monthly revenue for last 6 months
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const agg = await prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: startOfMonth(d), lte: endOfMonth(d) } },
      _sum: { totalAmount: true },
    });
    monthlyRevenue.push({
      month: format(d, 'M月', { locale: ja }),
      amount: agg._sum.totalAmount ?? 0,
    });
  }

  return NextResponse.json({
    totalRevenueThisMonth: thisMonth._sum.totalAmount ?? 0,
    totalRevenuePrevMonth: prevMonth._sum.totalAmount ?? 0,
    unpaidInvoicesCount: unpaid._count.id ?? 0,
    unpaidInvoicesTotal: unpaid._sum.totalAmount ?? 0,
    overdueInvoicesCount: overdue._count.id ?? 0,
    overdueInvoicesTotal: overdue._sum.totalAmount ?? 0,
    draftEstimatesCount: draftEstimates,
    recentInvoices,
    monthlyRevenue,
  });
}
