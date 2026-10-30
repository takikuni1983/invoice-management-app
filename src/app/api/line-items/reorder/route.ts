import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiErrorResponse } from '@/lib/api-error';

// 詳細画面のドラッグで明細の並び順を変更する
//   { docType: 'estimates' | 'invoices' | 'orders' | 'delivery-notes', docId, ids: [明細ID（新しい順番）] }
// 並び順だけの変更なので金額は変わらず、変更履歴にも記録しない
const MODELS = {
  estimates: { model: 'estimateLineItem', fk: 'estimateId' },
  invoices: { model: 'invoiceLineItem', fk: 'invoiceId' },
  orders: { model: 'orderAcceptanceLineItem', fk: 'orderId' },
  'delivery-notes': { model: 'deliveryNoteLineItem', fk: 'deliveryNoteId' },
} as const;

export async function POST(req: NextRequest) {
  const { docType, docId, ids } = (await req.json()) ?? {};
  const target = typeof docType === 'string' && Object.hasOwn(MODELS, docType) ? MODELS[docType as keyof typeof MODELS] : null;
  if (!target || !Number.isInteger(docId) || !Array.isArray(ids) || !ids.every(Number.isInteger)) {
    return NextResponse.json({ error: '並び替えの指定が正しくありません' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // model 名は MODELS の固定値なので、4種類の明細を同じ処理で扱う
    const delegate = (tx as any)[target.model];
    const current: { id: number }[] = await delegate.findMany({ where: { [target.fk]: docId }, select: { id: true } });
    const known = new Set(current.map(r => r.id));
    if (ids.length !== known.size || new Set(ids).size !== ids.length || !ids.every((i: number) => known.has(i))) {
      return NextResponse.json({ error: '明細が変更されています。画面を再読み込みしてください' }, { status: 409 });
    }
    for (let i = 0; i < ids.length; i++) {
      await delegate.update({ where: { id: ids[i] }, data: { sortOrder: i } });
    }
    return NextResponse.json({ success: true });
  }).catch(apiErrorResponse);
  return result;
}
