// 見積・請求・発注請書・納品書の番号の自動採番と重複チェック
//
// 採番ルール（設定 > 番号設定 で変更できる）
//   次の番号 = 接頭辞 + (最新の番号 + 1) を桁数でゼロ埋め   例: EST- / 737 / 6桁 → EST-000738
//   - 自動で振った番号、または手入力した同じ形式でより大きい番号で「最新の番号」を更新する
//   - 作ろうとした番号が既に使われていたら、空いている番号まで進める
//   - 設定が未保存のときは、既存の番号から最大値と桁数を推定する
import { Prisma, PrismaClient } from '@prisma/client';

export type DocType = 'estimate' | 'invoice' | 'order' | 'delivery';

export const DOC_TYPES: { type: DocType; label: string; defaultPrefix: string }[] = [
  { type: 'estimate', label: '見積書', defaultPrefix: 'EST-' },
  { type: 'order', label: '発注請書', defaultPrefix: 'ORD-' },
  { type: 'invoice', label: '請求書', defaultPrefix: 'INV-' },
  { type: 'delivery', label: '納品書', defaultPrefix: 'DN-' },
];

export interface NumberConfig {
  prefix: string;
  lastNumber: number;
  digits: number;
}

type Db = PrismaClient | Prisma.TransactionClient;

export class NumberTakenError extends Error {
  constructor(number: string) {
    super(`番号「${number}」は既に使われています`);
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 「接頭辞 + 数字」の形式なら数字部分を返す */
function parseNumber(prefix: string, number: string): { value: number; width: number } | null {
  const m = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`).exec(number);
  return m ? { value: parseInt(m[1], 10), width: m[1].length } : null;
}

export function formatNumber(config: NumberConfig, value: number): string {
  return `${config.prefix}${String(value).padStart(config.digits, '0')}`;
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

/** 保存済みの設定。なければ既存の番号から推定する（推定値は保存しない） */
export async function getNumberConfig(db: Db, type: DocType): Promise<NumberConfig> {
  const saved = await db.numberSetting.findUnique({ where: { docType: type } }).catch((err) => {
    // DB の更新前（NumberSetting テーブルがない）でも、読み取りは既存の番号からの推定で続ける
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') return null;
    throw err;
  });
  if (saved) return { prefix: saved.prefix, lastNumber: saved.lastNumber, digits: saved.digits };

  const prefix = DOC_TYPES.find(d => d.type === type)!.defaultPrefix;
  let lastNumber = 0;
  let digits = 4;
  for (const n of await existingNumbers(db, type)) {
    const p = parseNumber(prefix, n);
    if (p && (p.value > lastNumber || (p.value === lastNumber && p.width > digits))) {
      lastNumber = p.value;
      digits = Math.max(4, p.width);
    }
  }
  return { prefix, lastNumber, digits };
}

async function saveLastNumber(db: Db, type: DocType, config: NumberConfig, lastNumber: number) {
  await db.numberSetting.upsert({
    where: { docType: type },
    create: { docType: type, prefix: config.prefix, digits: config.digits, lastNumber },
    update: { lastNumber },
  });
}

/** 次に自動で振られる番号（既に使われている番号は飛ばす） */
async function peekNext(db: Db, type: DocType): Promise<{ config: NumberConfig; value: number; number: string }> {
  const config = await getNumberConfig(db, type);
  let value = config.lastNumber + 1;
  while ((await findIdByNumber(db, type, formatNumber(config, value))) !== null) value++;
  return { config, value, number: formatNumber(config, value) };
}

export async function nextNumber(db: Db, type: DocType): Promise<string> {
  return (await peekNext(db, type)).number;
}

/**
 * 保存に使う番号を決める。空欄なら自動採番、入力があれば重複チェックしてそのまま使う。
 * selfId: 編集時の自分自身の id（自分の番号との重複は許可）
 */
export async function resolveNumber(
  db: Db, type: DocType, requested: unknown, selfId?: number,
): Promise<string> {
  const number = typeof requested === 'string' ? requested.trim() : '';

  if (!number) {
    const next = await peekNext(db, type);
    await saveLastNumber(db, type, next.config, next.value);
    return next.number;
  }

  const id = await findIdByNumber(db, type, number);
  if (id !== null && id !== selfId) throw new NumberTakenError(number);

  // 手入力でも同じ形式でより大きい番号なら「最新の番号」を進める
  const config = await getNumberConfig(db, type);
  const parsed = parseNumber(config.prefix, number);
  if (parsed && parsed.value > config.lastNumber) await saveLastNumber(db, type, config, parsed.value);

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
