import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildLineItems, calcTotals, buildCustomFields } from '@/lib/line-items';

const include = {
  customer: true,
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  customFields: { orderBy: { sortOrder: 'asc' as const } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.orderAcceptance.findUnique({ where: { id: Number(id) }, include });
  if (!order) return NextResponse.json({ error: '発注請書が見つかりません' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    customerId, status, orderDate, subject, deliveryDate, deliveryPlace,
    paymentTerms, notes, lineItems, discount, customFields,
  } = body;

  if (!customerId || !orderDate) {
    return NextResponse.json({ error: '顧客と発注日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.orderAcceptanceLineItem.deleteMany({ where: { orderId: Number(id) } });
    await tx.orderAcceptanceCustomField.deleteMany({ where: { orderId: Number(id) } });

    const items = buildLineItems(lineItems);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.orderAcceptance.update({
      where: { id: Number(id) },
      data: {
        customerId: Number(customerId),
        status,
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
      include,
    });
  });

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.orderAcceptance.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
