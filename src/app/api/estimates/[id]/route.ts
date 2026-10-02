import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ESTIMATE_STATUS_LABELS } from '@/lib/utils';
import { resolveNumberForUpdate } from '@/lib/numbering';
import { apiErrorResponse } from '@/lib/api-error';
import { buildLineItems, calcTotals, buildCustomFields } from '@/lib/line-items';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estimate = await prisma.estimate.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      lineItems: { orderBy: { sortOrder: 'asc' } },
      customFields: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!estimate) return NextResponse.json({ error: '見積書が見つかりません' }, { status: 404 });
  return NextResponse.json(estimate);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { customerId, status, issueDate, expiryDate, subject, projectName, notes, terms, taxRate, lineItems, discount, customFields } = body;

  const result = await prisma.$transaction(async (tx) => {
    const estimateNumber = await resolveNumberForUpdate(tx, 'estimate', body.estimateNumber, Number(id));
    await tx.estimateLineItem.deleteMany({ where: { estimateId: Number(id) } });
    await tx.estimateCustomField.deleteMany({ where: { estimateId: Number(id) } });

    const rate = Number(taxRate ?? 10);
    const items = buildLineItems(lineItems, rate);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.estimate.update({
      where: { id: Number(id) },
      data: {
        estimateNumber,
        customerId: Number(customerId),
        status,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        subject,
        projectName: projectName ?? '',
        notes,
        terms,
        taxRate: rate,
        ...totals,
        lineItems: { create: items },
        customFields: fields.length > 0 ? { create: fields } : undefined,
      },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }).catch(apiErrorResponse);
  if (result instanceof Response) return result;

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.estimate.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}

// ステータスだけを変更する（詳細画面のプルダウン）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (typeof status !== 'string' || !(status in ESTIMATE_STATUS_LABELS)) {
    return NextResponse.json({ error: 'ステータスが正しくありません' }, { status: 400 });
  }
  try {
  await prisma.estimate.update({ where: { id: Number(id) }, data: { status } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
