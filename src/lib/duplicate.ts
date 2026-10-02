// 書類の「複製」: 元の書類の内容を新規作成フォームの初期値にする
// - 引き継ぐ: 顧客・件名・明細・値引き・カスタム項目・備考・取引条件・その他の日付（有効期限・支払期限・納期 など）
// - リセット: id・番号（保存時に自動採番）・ステータス（下書き）・発行日/発注日/納品日（今日）
//             元の見積・請求とのつながり、入金日
import { prisma } from '@/lib/db';

const include = {
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  customFields: { orderBy: { sortOrder: 'asc' as const } },
};

/** ?duplicate=123 の値を id に変換（不正な値は null） */
export function duplicateId(param: string | undefined): number | null {
  const id = Number(param);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function duplicateEstimate(id: number) {
  const src = await prisma.estimate.findUnique({ where: { id }, include });
  if (!src) return null;
  return { source: src.estimateNumber, initial: { ...src, id: undefined, estimateNumber: '', status: 'DRAFT', issueDate: new Date() } };
}

export async function duplicateInvoice(id: number) {
  const src = await prisma.invoice.findUnique({ where: { id }, include });
  if (!src) return null;
  return {
    source: src.invoiceNumber,
    initial: { ...src, id: undefined, invoiceNumber: '', status: 'DRAFT', issueDate: new Date(), estimateId: null, paidAt: null },
  };
}

export async function duplicateOrder(id: number) {
  const src = await prisma.orderAcceptance.findUnique({ where: { id }, include });
  if (!src) return null;
  return { source: src.orderNumber, initial: { ...src, id: undefined, orderNumber: '', status: 'DRAFT', orderDate: new Date(), estimateId: null } };
}

export async function duplicateDeliveryNote(id: number) {
  const src = await prisma.deliveryNote.findUnique({ where: { id }, include });
  if (!src) return null;
  return {
    source: src.deliveryNumber,
    initial: { ...src, id: undefined, deliveryNumber: '', status: 'DRAFT', deliveryDate: new Date(), invoiceId: null },
  };
}
