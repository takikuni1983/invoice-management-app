// 見積書・請求書の金額の変更履歴
// - 保存（PUT）の前後で金額が変わったときに、前後のスナップショットを記録する
// - 「金額が変わった」= 小計・消費税・値引き・総額、または明細の行数・数量・単価・税率・金額のいずれかが変化
//   （品目名・注釈・件名などだけの変更は記録しない）
// - 書類ごとに最新 MAX_REVISIONS 件まで残し、古いものは削除する
import { Prisma, PrismaClient } from '@prisma/client';

export const MAX_REVISIONS = 5;

// DB の更新前（DocumentRevision テーブルがない）でも、保存や表示は止めずに履歴だけ飛ばす
function ignoreMissingTable<T>(fallback: T) {
  return (err: unknown): T => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') return fallback;
    throw err;
  };
}

export type RevisionDocType = 'estimate' | 'invoice';
type Db = PrismaClient | Prisma.TransactionClient;

export interface SnapshotItem {
  description: string;
  details: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Snapshot {
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  items: SnapshotItem[];
}

export function toSnapshot(doc: {
  subtotal: number; taxAmount: number; discount: number | null; totalAmount: number;
  lineItems: { description: string; details: string | null; quantity: number; unitPrice: number; taxRate: number; amount: number }[];
}): Snapshot {
  return {
    subtotal: doc.subtotal,
    taxAmount: doc.taxAmount,
    discount: doc.discount ?? 0,
    totalAmount: doc.totalAmount,
    items: doc.lineItems.map(li => ({
      description: li.description,
      details: li.details ?? null,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      taxRate: li.taxRate,
      amount: li.amount,
    })),
  };
}

/** 金額に関わる値が変わったか */
export function amountChanged(a: Snapshot, b: Snapshot): boolean {
  if (a.subtotal !== b.subtotal || a.taxAmount !== b.taxAmount || a.discount !== b.discount || a.totalAmount !== b.totalAmount) return true;
  if (a.items.length !== b.items.length) return true;
  return a.items.some((x, i) => {
    const y = b.items[i];
    return x.quantity !== y.quantity || x.unitPrice !== y.unitPrice || x.taxRate !== y.taxRate || x.amount !== y.amount;
  });
}

/** 金額が変わっていれば履歴を1件追加し、古い履歴を MAX_REVISIONS 件まで削る */
export async function recordRevision(db: Db, docType: RevisionDocType, docId: number, before: Snapshot, after: Snapshot) {
  if (!amountChanged(before, after)) return;
  const created = await db.documentRevision.create({
    data: { docType, docId, before: JSON.stringify(before), after: JSON.stringify(after) },
  }).catch(ignoreMissingTable(null));
  if (!created) return;
  const old = await db.documentRevision.findMany({
    where: { docType, docId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: MAX_REVISIONS,
    select: { id: true },
  });
  if (old.length) await db.documentRevision.deleteMany({ where: { id: { in: old.map(o => o.id) } } });
}

export async function getRevisions(db: Db, docType: RevisionDocType, docId: number) {
  const rows = await db.documentRevision.findMany({
    where: { docType, docId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: MAX_REVISIONS,
  }).catch(ignoreMissingTable([]));
  return rows.map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    before: JSON.parse(r.before) as Snapshot,
    after: JSON.parse(r.after) as Snapshot,
  }));
}

export async function deleteRevisions(db: Db, docType: RevisionDocType, docId: number) {
  await db.documentRevision.deleteMany({ where: { docType, docId } }).catch(ignoreMissingTable(null));
}
