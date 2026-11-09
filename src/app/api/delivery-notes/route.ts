import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveNumberFromSource } from '@/lib/numbering';
import { apiErrorResponse } from '@/lib/api-error';
import { buildLineItems, calcTotals, buildCustomFields } from '@/lib/line-items';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const invoiceId = searchParams.get('invoiceId');

  const notes = await prisma.deliveryNote.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId: Number(customerId) } : {}),
      ...(invoiceId ? { invoiceId: Number(invoiceId) } : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    customerId, invoiceId, status, deliveryDate, subject, deliveryFormat,
    notes, lineItems, discount, customFields,
  } = body;

  if (!customerId || !deliveryDate) {
    return NextResponse.json({ error: '顧客と納品日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // 請求書から作成したときは、番号の指定がなければ請求番号の数字を引き継ぐ（INV-000700 → DN-000700）
    const source = invoiceId
      ? await tx.invoice.findUnique({ where: { id: Number(invoiceId) }, select: { invoiceNumber: true } })
      : null;
    const deliveryNumber = await resolveNumberFromSource(tx, 'delivery', body.deliveryNumber, source?.invoiceNumber);

    const items = buildLineItems(lineItems);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.deliveryNote.create({
      data: {
        deliveryNumber,
        customerId: Number(customerId),
        invoiceId: invoiceId ? Number(invoiceId) : null,
        status: status ?? 'DRAFT',
        deliveryDate: new Date(deliveryDate),
        subject: subject ?? '',
        deliveryFormat: deliveryFormat ?? '',
        notes: notes ?? '',
        ...totals,
        lineItems: { create: items },
        customFields: fields.length > 0 ? { create: fields } : undefined,
      },
    });
  }).catch(apiErrorResponse);
  if (result instanceof Response) return result;

  return NextResponse.json(result, { status: 201 });
}
