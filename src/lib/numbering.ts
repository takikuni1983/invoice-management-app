// 見積・請求・発注請書・納品書の番号の自動採番と重複チェック
import { Prisma, PrismaClient } from '@prisma/client';

export type DocType = 'estimate' | 'invoice' | 'order' | 'delivery';

export const DOC_PREFIX: Record<DocType, string> = {
  estimate: 'EST',
  invoice: 'INV',
  order: 'ORD',
  delivery: 'DN',
};

type Db = PrismaClient | Prisma.TransactionClient;

export class NumberTakenError extends Error {
  constructor(number: string) {
    super(`番号「${number}」は既に使われています`);
  }
}

/**
 * 既存の番号のうち「接頭辞-数字」の形式のものから最大値を探し、+1 した番号を返す。
 * 桁数は最大の番号に合わせる（Zoho から取り込んだ EST-000737 → EST-000738）。
 * 手入力した形式の違う番号は採番の対象外。
 */
export function nextNumberFrom(prefix: string, numbers: string[]): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  let width = 4;
  for (const n of numbers) {
    const m = re.exec(n);
    if (!m) continue;
    const v = parseInt(m[1], 10);
    if (v > max || (v === max && m[1].length > width)) {
      max = v;
      width = Math.max(4, m[1].length);
    }
  }
  return `${prefix}-${String(max + 1).padStart(width, '0')}`;
}

async function existingNumbers(db: Db, type: DocType): Promise<string[]> {
  switch (type) {
    case 'estimate':
      return (await db.estimate.findMany({ select: { estimateNumber: true } })).map(r => r.estimateNumber);
    case 'invoice':
      return (await db.invoice.findMany({ select: { invoiceNumber: true } })).map(r => r.invoiceNumber);
    case 'order':
      return (await db.orderAcceptance.findMany({ select: { orderNumber: true } })).map(r => r.orderNumber);
    case 'delivery':
      return (await db.deliveryNote.findMany({ select: { deliveryNumber: true } })).map(r => r.deliveryNumber);
  }
}

async function findIdByNumber(db: Db, type: DocType, number: string): Promise<number | null> {
  switch (type) {
    case 'estimate':
      return (await db.estimate.findUnique({ where: { estimateNumber: number }, select: { id: true } }))?.id ?? null;
    case 'invoice':
      return (await db.invoice.findUnique({ where: { invoiceNumber: number }, select: { id: true } }))?.id ?? null;
    case 'order':
      return (await db.orderAcceptance.findUnique({ where: { orderNumber: number }, select: { id: true } }))?.id ?? null;
    case 'delivery':
      return (await db.deliveryNote.findUnique({ where: { deliveryNumber: number }, select: { id: true } }))?.id ?? null;
  }
}

export async function nextNumber(db: Db, type: DocType): Promise<string> {
  return nextNumberFrom(DOC_PREFIX[type], await existingNumbers(db, type));
}

/**
 * 保存に使う番号を決める。空欄なら自動採番、入力があれば重複チェックしてそのまま使う。
 * selfId: 編集時の自分自身の id（自分の番号との重複は許可）
 */
export async function resolveNumber(
  db: Db, type: DocType, requested: unknown, selfId?: number,
): Promise<string> {
  const number = typeof requested === 'string' ? requested.trim() : '';
  if (!number) return nextNumber(db, type);
  const id = await findIdByNumber(db, type, number);
  if (id !== null && id !== selfId) throw new NumberTakenError(number);
  return number;
}

/** 編集時用: 空欄なら番号を変更しない（undefined を返す） */
export async function resolveNumberForUpdate(
  db: Db, type: DocType, requested: unknown, selfId: number,
): Promise<string | undefined> {
  const number = typeof requested === 'string' ? requested.trim() : '';
  if (!number) return undefined;
  return resolveNumber(db, type, number, selfId);
}

/** API ルートで NumberTakenError を 400 にする */
export function numberErrorResponse(err: unknown) {
  if (err instanceof NumberTakenError) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  throw err;
}
