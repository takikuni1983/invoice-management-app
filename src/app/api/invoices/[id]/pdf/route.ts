import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/pdf/invoice-template';
import React from 'react';
import { pdfContentDisposition } from '@/lib/pdf/filename';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let invoice: any = null;
  let companyInfo: any = null;

  try {
    [invoice, companyInfo] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id: Number(id) },
        include: {
          customer: true,
          lineItems: { orderBy: { sortOrder: 'asc' } },
          customFields: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
    ]);
  } catch (err: any) {
    // customFields テーブルが未作成の場合、customFields なしで再取得
    console.warn('[PDF] DB fetch with customFields failed, retrying without:', err?.message);
    invoice = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { customer: true, lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  if (!invoice) return NextResponse.json({ error: '請求書が見つかりません' }, { status: 404 });

  try {
    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice, companyInfo }) as any
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': pdfContentDisposition(invoice.issueDate, invoice.invoiceNumber),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'PDF生成エラー', detail: String(err?.message) }, { status: 500 });
  }
}
