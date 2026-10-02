import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrderAcceptancePDF } from '@/lib/pdf/simple-doc-template';
import React from 'react';
import { pdfContentDisposition } from '@/lib/pdf/filename';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [order, companyInfo] = await Promise.all([
    prisma.orderAcceptance.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!order) return NextResponse.json({ error: '発注請書が見つかりません' }, { status: 404 });

  try {
    const buffer = await renderToBuffer(
      React.createElement(OrderAcceptancePDF, {
        order: order as any,
        companyInfo: companyInfo ?? undefined,
      }) as any
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': pdfContentDisposition(order.orderDate, order.orderNumber),
      },
    });
  } catch (err: any) {
    console.error('[PDF] render error:', err);
    return NextResponse.json({ error: err?.message ?? 'PDF生成に失敗しました' }, { status: 500 });
  }
}
