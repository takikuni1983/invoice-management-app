import { format } from 'date-fns';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_REVISIONS, type Snapshot, type SnapshotItem } from '@/lib/revisions';

// 見積書・請求書の詳細画面: 書類の下に出す金額の変更履歴（新しい順、最大 MAX_REVISIONS 件）
// 各行は「日時 / 総額 変更前 → 変更後（差額）」。開くと金額・明細の変更点を表示する

interface Revision {
  id: number;
  createdAt: Date;
  before: Snapshot;
  after: Snapshot;
}

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const qty = (n: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: 2 });

function Diff({ value }: { value: number }) {
  if (value === 0) return <span className="text-gray-400">±0</span>;
  return (
    <span className={value > 0 ? 'text-blue-600' : 'text-red-600'}>
      {value > 0 ? '+' : '−'}{Math.abs(value).toLocaleString('ja-JP')}
    </span>
  );
}

type ItemChange =
  | { kind: 'added'; item: SnapshotItem }
  | { kind: 'removed'; item: SnapshotItem }
  | { kind: 'changed'; before: SnapshotItem; after: SnapshotItem };

const sameName = (a: SnapshotItem, b: SnapshotItem) => a.description === b.description;
const sameMoney = (a: SnapshotItem, b: SnapshotItem) =>
  a.quantity === b.quantity && a.unitPrice === b.unitPrice && a.taxRate === b.taxRate && a.amount === b.amount;

// 明細の変更点: 品目名が同じ行どうしを対応づけ、残りは同じ位置の行どうし、それでも余った行は追加／削除
function diffItems(before: SnapshotItem[], after: SnapshotItem[]): ItemChange[] {
  const pairs = new Map<number, number>(); // after index -> before index
  const usedBefore = new Set<number>();
  after.forEach((a, ai) => {
    const bi = before.findIndex((b, i) => !usedBefore.has(i) && sameName(a, b));
    if (bi >= 0) { pairs.set(ai, bi); usedBefore.add(bi); }
  });
  after.forEach((_, ai) => {
    if (pairs.has(ai) || ai >= before.length || usedBefore.has(ai)) return;
    pairs.set(ai, ai); usedBefore.add(ai);
  });

  const changes: ItemChange[] = [];
  after.forEach((a, ai) => {
    const bi = pairs.get(ai);
    if (bi === undefined) changes.push({ kind: 'added', item: a });
    else if (!sameMoney(before[bi], a) || !sameName(before[bi], a)) changes.push({ kind: 'changed', before: before[bi], after: a });
  });
  before.forEach((b, bi) => { if (!usedBefore.has(bi)) changes.push({ kind: 'removed', item: b }); });
  return changes;
}

function itemSummary(i: SnapshotItem) {
  return `${qty(i.quantity)} × ${yen(i.unitPrice)} = ${yen(i.amount)}${i.taxRate !== 10 ? `（税${i.taxRate}%）` : ''}`;
}

function Field({ label, before, after, format: fmt = (n: number) => n.toLocaleString('ja-JP') }: {
  label: string; before: number; after: number; format?: (n: number) => string;
}) {
  if (before === after) return null;
  return (
    <span className="whitespace-nowrap">
      {label} {fmt(before)} → <span className="font-medium text-gray-900">{fmt(after)}</span>
    </span>
  );
}

function RevisionDetail({ before, after }: { before: Snapshot; after: Snapshot }) {
  const totals = [
    { label: '小計', b: before.subtotal, a: after.subtotal },
    { label: '消費税', b: before.taxAmount, a: after.taxAmount },
    { label: '値引き', b: before.discount, a: after.discount },
    { label: '総額', b: before.totalAmount, a: after.totalAmount },
  ].filter(r => r.a !== r.b);
  const items = diffItems(before.items, after.items);

  return (
    <div className="space-y-3 border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
      {totals.length > 0 && (
        <table className="w-full max-w-sm">
          <tbody>
            {totals.map(r => (
              <tr key={r.label}>
                <td className="py-0.5 pr-3 text-gray-500">{r.label}</td>
                <td className="py-0.5 pr-2 text-right tabular-nums">{yen(r.b)}</td>
                <td className="py-0.5 pr-2 text-gray-400">→</td>
                <td className="py-0.5 pr-3 text-right font-medium text-gray-900 tabular-nums">{yen(r.a)}</td>
                <td className="py-0.5 text-right tabular-nums"><Diff value={r.a - r.b} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {items.length > 0 && (
        <div>
          <p className="mb-1 text-gray-500">明細の変更</p>
          <ul className="space-y-1.5">
            {items.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className={cn(
                  'shrink-0 rounded px-1.5 py-px text-[11px] font-medium',
                  c.kind === 'added' && 'bg-blue-100 text-blue-700',
                  c.kind === 'removed' && 'bg-red-100 text-red-700',
                  c.kind === 'changed' && 'bg-amber-100 text-amber-800',
                )}>
                  {c.kind === 'added' ? '追加' : c.kind === 'removed' ? '削除' : '変更'}
                </span>
                {c.kind === 'changed' ? (
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">
                      {c.before.description === c.after.description
                        ? c.after.description || '（品目名なし）'
                        : <>{c.before.description || '（品目名なし）'} → {c.after.description || '（品目名なし）'}</>}
                    </p>
                    <p className="flex flex-wrap gap-x-3">
                      <Field label="数量" before={c.before.quantity} after={c.after.quantity} format={qty} />
                      <Field label="単価" before={c.before.unitPrice} after={c.after.unitPrice} format={yen} />
                      <Field label="税率" before={c.before.taxRate} after={c.after.taxRate} format={n => `${n}%`} />
                      <Field label="金額" before={c.before.amount} after={c.after.amount} format={yen} />
                    </p>
                  </div>
                ) : (
                  <div className={cn('min-w-0', c.kind === 'removed' && 'text-gray-400 line-through')}>
                    <p className="font-medium">{c.item.description || '（品目名なし）'}</p>
                    <p>{itemSummary(c.item)}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RevisionHistory({ revisions }: { revisions: Revision[] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <h3 className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-900">
        <History className="h-4 w-4 text-gray-500" />
        変更履歴
        <span className="text-xs font-normal text-gray-500">（金額の変更・最新{MAX_REVISIONS}件）</span>
      </h3>
      {revisions.length === 0 ? (
        <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">金額の変更はまだありません</p>
      ) : (
        <ul>
          {revisions.map(r => (
            <li key={r.id} className="border-t border-gray-100">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                  <span className="text-gray-400 transition-transform group-open:rotate-90">›</span>
                  <span className="text-xs text-gray-500 tabular-nums">{format(r.createdAt, 'yyyy/MM/dd HH:mm')}</span>
                  <span className="tabular-nums">
                    <span className="text-gray-500">{yen(r.before.totalAmount)}</span>
                    <span className="mx-1.5 text-gray-400">→</span>
                    <span className="font-medium text-gray-900">{yen(r.after.totalAmount)}</span>
                  </span>
                  <span className="text-xs tabular-nums">（<Diff value={r.after.totalAmount - r.before.totalAmount} />）</span>
                </summary>
                <RevisionDetail before={r.before} after={r.after} />
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
