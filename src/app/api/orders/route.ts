import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils';
import { buildLineItems, calcTotals, buildCustomFields } from '@/lib/line-items';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const estimateId = searchParams.get('estimateId');

  const orders = await prisma.orderAcceptance.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId: Number(customerId) } : {}),
      ...(estimateId ? { estimateId: Number(estimateId) } : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    customerId, estimateId, status, orderDate, subject, deliveryDate, deliveryPlace,
    paymentTerms, notes, lineItems, discount, customFields,
  } = body;

  if (!customerId || !orderDate) {
    return NextResponse.json({ error: '顧客と発注日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const last = await tx.orderAcceptance.findFirst({ orderBy: { orderNumber: 'desc' } });
    const orderNumber = generateOrderNumber(last?.orderNumber ?? null);

    const items = buildLineItems(lineItems);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    const order = await tx.orderAcceptance.create({
      data: {
        orderNumber,
        customerId: Number(customerId),
        estimateId: estimateId ? Number(estimateId) : null,
        status: status ?? 'DRAFT',
        orderDate: new Date(orderDate),
        subject: subject ?? '',
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryPlace: deliveryPlace ?? '',
        paymentTerms: paymentTerms ?? '',
        notes: notes ?? '',
        ...totals,
        lineItems: { create: items },
        customFields: fields.length > 0 ? { create: fields } : undefined,
      },
    });

    // 発注を受けた見積書は「承認済み」にする（請求済みなど先のステータスは維持）
    if (estimateId) {
      await tx.estimate.updateMany({
        where: { id: Number(estimateId), status: { in: ['DRAFT', 'SENT'] } },
        data: { status: 'APPROVED' },
      });
    }

    return order;
  });

  return NextResponse.json(result, { status: 201 });
}
