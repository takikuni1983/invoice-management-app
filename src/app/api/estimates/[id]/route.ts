import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    await tx.estimateLineItem.deleteMany({ where: { estimateId: Number(id) } });
    await tx.estimateCustomField.deleteMany({ where: { estimateId: Number(id) } });

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

    return tx.estimate.update({
      where: { id: Number(id) },
      data: {
        customerId: Number(customerId),
        status,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        subject,
        projectName: projectName ?? '',
        notes,
        terms,
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

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.estimate.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
