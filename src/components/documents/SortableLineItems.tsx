'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical } from 'lucide-react';
import { docFont } from '@/lib/doc-fonts';
import { responseError } from '@/lib/response-error';

// 書類プレビューの明細行。左端のつまみをドラッグ（またはつまみを選んで ↑↓ キー）で並べ替え、離した時点で保存する。
// FitToWidth で縮小表示されていても、行の位置は getBoundingClientRect（画面上の座標）で判定するのでずれない。
// スマホでもつまみを押さえたまま上下に動かせる（つまみの上ではスクロールしない）

export type ReorderDocType = 'estimates' | 'invoices' | 'orders' | 'delivery-notes';

export interface PreviewLineItem {
  id: number; description: string; details: string | null;
  quantity: number; unitPrice: number; amount: number; taxRate: number;
}

interface Props {
  lineItems: PreviewLineItem[];
  showTaxColumn: boolean;
  /** 指定すると並べ替えできる（保存先の書類） */
  reorder?: { docType: ReorderDocType; docId: number };
  border: string;
  gray: string;
}

const num = (n: number) => n.toLocaleString('ja-JP');
const cellPad = { padding: '9pt 6pt' };
const sameOrder = (a: PreviewLineItem[], b: PreviewLineItem[]) => a.length === b.length && a.every((x, i) => x.id === b[i].id);

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function SortableLineItems({ lineItems, showTaxColumn, reorder, border, gray }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(lineItems);
  const [dragId, setDragId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const rowRefs = useRef(new Map<number, HTMLTableRowElement>());
  const startOrder = useRef<PreviewLineItem[]>(lineItems);

  // 保存後の再読み込みや編集で明細が変わったら追従する
  useEffect(() => { setItems(lineItems); }, [lineItems]);

  const canSort = !!reorder && items.length > 1;

  async function save(next: PreviewLineItem[], prev: PreviewLineItem[]) {
    if (!reorder || sameOrder(next, prev)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/line-items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reorder, ids: next.map(i => i.id) }),
      });
      if (!res.ok) throw new Error(await responseError(res, '並び順の保存に失敗しました'));
      router.refresh();
    } catch (err: any) {
      setItems(prev);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: number) {
    if (saving || e.button !== 0) return;
    e.preventDefault();
    startOrder.current = items;
    setDragId(id);
  }

  // ドラッグ中はウィンドウでポインターを追う（行の DOM が入れ替わってもドラッグが途切れないように）
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    if (dragId === null) return;
    const onMove = (e: PointerEvent) => {
      const list = itemsRef.current;
      const from = list.findIndex(i => i.id === dragId);
      // ポインターが上下の行の中央を越えたら入れ替え
      let to = from;
      list.forEach((item, i) => {
        const r = rowRefs.current.get(item.id)?.getBoundingClientRect();
        if (!r) return;
        const mid = r.top + r.height / 2;
        if (i < from && e.clientY < mid) to = Math.min(to, i);
        if (i > from && e.clientY > mid) to = Math.max(to, i);
      });
      if (to !== from) setItems(move(list, from, to));
    };
    const onEnd = () => {
      setDragId(null);
      save(itemsRef.current, startOrder.current);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ドラッグ開始時だけ登録する
  }, [dragId]);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (saving || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const to = e.key === 'ArrowUp' ? index - 1 : index + 1;
    if (to < 0 || to >= items.length) return;
    const next = move(items, index, to);
    setItems(next);
    save(next, items);
  }

  return (
    <tbody style={{ opacity: saving ? 0.6 : 1 }}>
      {items.map((item, index) => {
        const dragging = item.id === dragId;
        return (
          <tr
            key={item.id}
            ref={(el) => { if (el) rowRefs.current.set(item.id, el); else rowRefs.current.delete(item.id); }}
            className="group"
            style={{
              borderBottom: `0.5pt solid ${border}`,
              backgroundColor: dragging ? '#eff6ff' : undefined,
              boxShadow: dragging ? '0 0 0 1pt #93c5fd' : undefined,
            }}
          >
            <td className="relative align-top" style={cellPad}>
              {canSort && (
                // 書類の左余白（40pt）に置くつまみ。PDF には出ない
                <button
                  type="button"
                  aria-label={`${item.description || '明細'} を並べ替え（↑↓キーでも移動）`}
                  title="ドラッグで並べ替え"
                  disabled={saving}
                  onPointerDown={(e) => onPointerDown(e, item.id)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className="absolute flex items-center justify-center rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 group-hover:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-gray-500"
                  style={{
                    left: '-30pt', top: '6pt', width: '22pt', height: '24pt',
                    touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab',
                    color: dragging ? '#3b82f6' : undefined,
                  }}
                >
                  <GripVertical style={{ width: '13pt', height: '13pt' }} />
                </button>
              )}
              <div className="font-medium" style={{ ...docFont('itemName'), marginBottom: '3pt' }}>{item.description}</div>
              {item.details && (
                <div className="whitespace-pre-line" style={{ ...docFont('itemDetail'), color: gray }}>{item.details}</div>
              )}
            </td>
            <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad }}>
              {item.quantity.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
            </td>
            <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad }}>{num(item.unitPrice)}</td>
            {showTaxColumn && (
              <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad, color: gray }}>
                {(item.taxRate ?? 10) === 0 ? '-' : `${item.taxRate ?? 10}`}
              </td>
            )}
            <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad }}>{num(item.amount)}</td>
          </tr>
        );
      })}
    </tbody>
  );
}
