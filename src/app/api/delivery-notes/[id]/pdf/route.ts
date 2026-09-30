import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { DeliveryNotePDF } from '@/lib/pdf/simple-doc-template';
import React from 'react';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [note, companyInfo] = await Promise.all([
    prisma.deliveryNote.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!note) return NextResponse.json({ error: '納品書が見つかりません' }, { status: 404 });

  try {
    const buffer = await renderToBuffer(
      React.createElement(DeliveryNotePDF, {
        note: note as any,
        companyInfo: companyInfo ?? undefined,
      }) as any
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${note.deliveryNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[PDF] render error:', err);
    return NextResponse.json({ error: err?.message ?? 'PDF生成に失敗しました' }, { status: 500 });
  }
}
