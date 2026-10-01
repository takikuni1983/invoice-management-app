import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
  const note = await prisma.deliveryNote.findUnique({ where: { id: Number(id) }, include });
  if (!note) return NextResponse.json({ error: '納品書が見つかりません' }, { status: 404 });
  return NextResponse.json(note);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    customerId, status, deliveryDate, subject, deliveryFormat,
    notes, lineItems, discount, customFields,
  } = body;

  if (!customerId || !deliveryDate) {
    return NextResponse.json({ error: '顧客と納品日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const deliveryNumber = await resolveNumberForUpdate(tx, 'delivery', body.deliveryNumber, Number(id));
    await tx.deliveryNoteLineItem.deleteMany({ where: { deliveryNoteId: Number(id) } });
    await tx.deliveryNoteCustomField.deleteMany({ where: { deliveryNoteId: Number(id) } });

    const items = buildLineItems(lineItems);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.deliveryNote.update({
      where: { id: Number(id) },
      data: {
        deliveryNumber,
        customerId: Number(customerId),
        status,
        deliveryDate: new Date(deliveryDate),
        subject: subject ?? '',
        deliveryFormat: deliveryFormat ?? '',
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
  await prisma.deliveryNote.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
