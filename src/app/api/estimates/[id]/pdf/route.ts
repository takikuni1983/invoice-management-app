import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { EstimatePDF } from '@/lib/pdf/estimate-template';
import React from 'react';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [estimate, companyInfo] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }),
  ]);

  if (!estimate) return NextResponse.json({ error: '見積書が見つかりません' }, { status: 404 });

  const buffer = await renderToBuffer(
    React.createElement(EstimatePDF, {
      estimate: estimate as any,
      companyInfo: companyInfo ?? undefined,
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${estimate.estimateNumber}.pdf"`,
    },
  });
}
