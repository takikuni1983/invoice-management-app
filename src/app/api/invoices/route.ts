import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { invoiceNumberFromEstimate, resolveNumber } from '@/lib/numbering';
import { apiErrorResponse } from '@/lib/api-error';
import { buildLineItems, calcTotals, buildCustomFields } from '@/lib/line-items';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const search = searchParams.get('search') ?? '';

  // Auto-mark overdue invoices
  await prisma.invoice.updateMany({
    where: { status: 'SENT', dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(customerId ? { customerId: Number(customerId) } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, estimateId, status, issueDate, dueDate, subject, notes, terms, taxRate, lineItems, discount, customFields } = body;

  if (!customerId || !issueDate) {
    return NextResponse.json({ error: '顧客と発行日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // 見積書から変換したときは、番号の指定がなければ見積番号の数字を引き継ぐ（使えなければ通常の自動採番）
    let requestedNumber = body.invoiceNumber;
    if (estimateId && !(typeof requestedNumber === 'string' && requestedNumber.trim())) {
      const estimate = await tx.estimate.findUnique({ where: { id: Number(estimateId) }, select: { estimateNumber: true } });
      if (estimate) requestedNumber = await invoiceNumberFromEstimate(tx, estimate.estimateNumber) ?? undefined;
    }
    const invoiceNumber = await resolveNumber(tx, 'invoice', requestedNumber);

    const rate = Number(taxRate ?? 10);
    const items = buildLineItems(lineItems, rate);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: Number(customerId),
        estimateId: estimateId ? Number(estimateId) : null,
        status: status ?? 'DRAFT',
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subject: subject ?? '',
        notes: notes ?? '',
        terms: terms ?? '',
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

    // 見積書から変換した場合は見積書を「請求済み」にする
    if (estimateId) {
      await tx.estimate.update({ where: { id: Number(estimateId) }, data: { status: 'INVOICED' } });
    }

    return invoice;
  }).catch(apiErrorResponse);
  if (result instanceof Response) return result;

  return NextResponse.json(result, { status: 201 });
}
