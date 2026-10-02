import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { INVOICE_STATUS_LABELS } from '@/lib/utils';
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
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(id) }, include });
  if (!invoice) return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { customerId, status, issueDate, dueDate, subject, notes, terms, taxRate, lineItems, paidAt, discount, customFields } = body;

  const result = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await resolveNumberForUpdate(tx, 'invoice', body.invoiceNumber, Number(id));
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId: Number(id) } });
    await tx.invoiceCustomField.deleteMany({ where: { invoiceId: Number(id) } });

    const rate = Number(taxRate ?? 10);
    const items = buildLineItems(lineItems, rate);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.invoice.update({
      where: { id: Number(id) },
      data: {
        invoiceNumber,
        customerId: Number(customerId),
        status,
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subject,
        notes,
        terms,
        taxRate: rate,
        ...totals,
        paidAt: paidAt ? new Date(paidAt) : null,
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
  await prisma.invoice.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}

// ステータスだけを変更する（詳細画面のプルダウン）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (typeof status !== 'string' || !(status in INVOICE_STATUS_LABELS)) {
    return NextResponse.json({ error: 'ステータスが正しくありません' }, { status: 400 });
  }
  try {
  // 入金済みにしたら入金日を記録（未設定のときは今日）、入金済み以外に戻したら入金日を消す
  const current = await prisma.invoice.findUnique({ where: { id: Number(id) }, select: { paidAt: true } });
  if (!current) return NextResponse.json({ error: '見つかりません' }, { status: 404 });
  const paidAt = status === 'PAID' ? (current.paidAt ?? new Date()) : null;
  await prisma.invoice.update({ where: { id: Number(id) }, data: { status, paidAt } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
