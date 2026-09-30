import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInvoiceNumber } from '@/lib/utils';
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
  const { customerId, estimateId, status, issueDate, dueDate, subject, notes, terms, bankInfo, taxRate, lineItems, discount, customFields } = body;

  if (!customerId || !issueDate) {
    return NextResponse.json({ error: '顧客と発行日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const last = await tx.invoice.findFirst({ orderBy: { invoiceNumber: 'desc' } });
    const invoiceNumber = generateInvoiceNumber(last?.invoiceNumber ?? null);

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
        bankInfo: bankInfo ?? '',
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
  });

  return NextResponse.json(result, { status: 201 });
}
