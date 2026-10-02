import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/utils';
import { resolveNumberForUpdate } from '@/lib/numbering';
import { apiErrorResponse } from '@/lib/api-error';
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
    const orderNumber = await resolveNumberForUpdate(tx, 'order', body.orderNumber, Number(id));
    await tx.orderAcceptanceLineItem.deleteMany({ where: { orderId: Number(id) } });
    await tx.orderAcceptanceCustomField.deleteMany({ where: { orderId: Number(id) } });

    const items = buildLineItems(lineItems);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.orderAcceptance.update({
      where: { id: Number(id) },
      data: {
        orderNumber,
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
  }).catch(apiErrorResponse);
  if (result instanceof Response) return result;

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.orderAcceptance.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}

// ステータスだけを変更する（詳細画面のプルダウン）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (typeof status !== 'string' || !(status in ORDER_STATUS_LABELS)) {
    return NextResponse.json({ error: 'ステータスが正しくありません' }, { status: 400 });
  }
  try {
  await prisma.orderAcceptance.update({ where: { id: Number(id) }, data: { status } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
