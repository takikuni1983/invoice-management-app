import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateEstimateNumber } from '@/lib/utils';

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
    const last = await tx.estimate.findFirst({ orderBy: { estimateNumber: 'desc' } });
    const estimateNumber = generateEstimateNumber(last?.estimateNumber ?? null);

    const items = (lineItems ?? []).map((item: any, i: number) => ({
      sortOrder: i,
      description: item.description,
      details: item.details ?? null,
      quantity: Number(item.quantity),
      unit: item.unit ?? '',
      unitPrice: Number(item.unitPrice),
      amount: Number(item.quantity) * Number(item.unitPrice),
      taxRate: Number(item.taxRate ?? taxRate ?? 10),
    }));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const rate = Number(taxRate ?? 10);
    const taxAmount = items.reduce((sum: number, item: any) => sum + Math.round(item.amount * item.taxRate / 100), 0);
    const discountAmount = Number(discount ?? 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const fields = (customFields ?? []).map((cf: any, i: number) => ({
      label: cf.label,
      value: cf.value ?? '',
      sortOrder: i,
    }));

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
        subtotal,
        taxRate: rate,
        taxAmount,
        totalAmount,
        discount: discountAmount,
        lineItems: { create: items },
        customFields: fields.length > 0 ? { create: fields } : undefined,
      },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    });
  });

  return NextResponse.json(result, { status: 201 });
}
