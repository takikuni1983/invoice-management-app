import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildLineItems, calcTotals, buildCustomFields } from '@/lib/line-items';
import { resolveNumber } from '@/lib/numbering';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const search = searchParams.get('search') ?? '';

  const estimates = await prisma.estimate.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(customerId ? { customerId: Number(customerId) } : {}),
      ...(search
        ? {
            OR: [
              { estimateNumber: { contains: search } },
              { subject: { contains: search } },
              { customer: { companyName: { contains: search } } },
            ],
          }
        : {}),
    },
    include: { customer: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(estimates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, status, issueDate, expiryDate, subject, projectName, notes, terms, taxRate, lineItems, discount, customFields } = body;

  if (!customerId || !issueDate) {
    return NextResponse.json({ error: '顧客と発行日は必須です' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const estimateNumber = await resolveNumber(tx, 'estimate', body.estimateNumber);

    const rate = Number(taxRate ?? 10);
    const items = buildLineItems(lineItems, rate);
    const totals = calcTotals(items, discount);
    const fields = buildCustomFields(customFields);

    return tx.estimate.create({
      data: {
        estimateNumber,
        customerId: Number(customerId),
        status: status ?? 'DRAFT',
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        subject: subject ?? '',
        projectName: projectName ?? '',
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
  }).catch(apiErrorResponse);
  if (result instanceof Response) return result;

  return NextResponse.json(result, { status: 201 });
}
