'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical } from 'lucide-react';
import { docFont } from '@/lib/doc-fonts';
import { responseError } from '@/lib/response-error';

// 書類プレビューの明細行。左端のつまみをドラッグ（またはつまみを選んで ↑↓ キー）で並べ替え、離した時点で保存する。
// ドラッグ中の行は影つきでポインターについて動き、ほかの行は入る位置を空けるようにずれる。
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

interface Drag {
  id: number;
  from: number;
  /** 今離したら入る位置 */
  to: number;
  /** ポインターの移動量（画面上の px） */
  dy: number;
  startY: number;
  /** ドラッグ開始時の各行の位置（ページ座標、画面上の px） */
  rows: { top: number; height: number }[];
  /** FitToWidth の縮小率（画面上の px ÷ 書類内の px） */
  scale: number;
}

const EDGE = 60; // 画面の上下端からこの範囲でドラッグすると自動スクロール

export default function SortableLineItems({ lineItems, showTaxColumn, reorder, border, gray }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(lineItems);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [saving, setSaving] = useState(false);
  const rowRefs = useRef(new Map<number, HTMLTableRowElement>());

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
    const rows = items.map(item => {
      const r = rowRefs.current.get(item.id)!.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    const el = rowRefs.current.get(id)!;
    const from = items.findIndex(i => i.id === id);
    setDrag({ id, from, to: from, dy: 0, startY: e.clientY + window.scrollY, rows, scale: rows[from].height / (el.offsetHeight || 1) });
  }

  // ドラッグ中はウィンドウでポインターを追う。行の並びはそのままで、ドラッグ中の行はポインターについて動き、
  // ほかの行は入る位置を空けるように上下へずれる。離した時点で並びを確定して保存する
  const dragging = drag !== null;
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (e.clientY < EDGE) window.scrollBy(0, -12);
      else if (e.clientY > window.innerHeight - EDGE) window.scrollBy(0, 12);
      setDrag(d => {
        if (!d) return d;
        const dy = e.clientY + window.scrollY - d.startY;
        const center = d.rows[d.from].top + d.rows[d.from].height / 2 + dy;
        let to = d.from;
        d.rows.forEach((r, i) => {
          const mid = r.top + r.height / 2;
          if (i < d.from && center < mid) to = Math.min(to, i);
          if (i > d.from && center > mid) to = Math.max(to, i);
        });
        return { ...d, dy, to };
      });
    };
    const onEnd = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d || d.to === d.from) return;
      const prev = itemsRef.current;
      const next = move(prev, d.from, d.to);
      setItems(next);
      save(next, prev);
    };
    const { cursor, userSelect } = document.body.style;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ドラッグ開始時だけ登録する
  }, [dragging]);

  // 各行のずらし量（書類内の px）
  function offsetOf(index: number) {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy / drag.scale;
    const h = drag.rows[drag.from].height / drag.scale;
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return h;
    if (drag.to > drag.from && index > drag.from && index <= drag.to) return -h;
    return 0;
  }

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
        const active = drag?.id === item.id;
        const offset = offsetOf(index);
        const cell = { ...cellPad, borderBottom: `0.5pt solid ${border}` };
        return (
          <tr
            key={item.id}
            ref={(el) => { if (el) rowRefs.current.set(item.id, el); else rowRefs.current.delete(item.id); }}
            className="group"
            style={{
              position: 'relative',
              zIndex: active ? 10 : undefined,
              transform: offset ? `translateY(${offset}px)` : undefined,
              // ほかの行はなめらかに場所を空ける。ドラッグ中の行はポインターにそのまま追従
              transition: drag && !active ? 'transform 150ms ease' : undefined,
              backgroundColor: active ? '#ffffff' : undefined,
              boxShadow: active ? '0 0 0 1pt #93c5fd, 0 8pt 20pt rgba(15, 23, 42, 0.18)' : undefined,
            }}
          >
            <td className="relative align-top" style={cell}>
              {canSort && (
                // 書類の左余白（40pt）に置くつまみ。PDF には出ない
                <button
                  type="button"
                  aria-label={`${item.description || '明細'} を並べ替え（↑↓キーでも移動）`}
                  title="ドラッグで並べ替え"
                  disabled={saving}
                  onPointerDown={(e) => onPointerDown(e, item.id)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className="absolute flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 group-hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-gray-700"
                  style={{
                    left: '-32pt', top: '5pt', width: '24pt', height: '26pt',
                    touchAction: 'none', cursor: active ? 'grabbing' : 'grab',
                    color: active ? '#2563eb' : undefined,
                    backgroundColor: active ? '#eff6ff' : undefined,
                    // ドラッグ中はほかの行のつまみを隠す（動いている行の横にのぞかないように）
                    opacity: drag && !active ? 0 : 1,
                  }}
                >
                  <GripVertical style={{ width: '15pt', height: '15pt' }} />
                </button>
              )}
              <div className="font-medium" style={{ ...docFont('itemName'), marginBottom: '3pt' }}>{item.description}</div>
              {item.details && (
                <div className="whitespace-pre-line" style={{ ...docFont('itemDetail'), color: gray }}>{item.details}</div>
              )}
            </td>
            <td className="align-top text-right" style={{ ...docFont('cell'), ...cell }}>
              {item.quantity.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
            </td>
            <td className="align-top text-right" style={{ ...docFont('cell'), ...cell }}>{num(item.unitPrice)}</td>
            {showTaxColumn && (
              <td className="align-top text-right" style={{ ...docFont('cell'), ...cell, color: gray }}>
                {(item.taxRate ?? 10) === 0 ? '-' : `${item.taxRate ?? 10}`}
              </td>
            )}
            <td className="align-top text-right" style={{ ...docFont('cell'), ...cell }}>{num(item.amount)}</td>
          </tr>
        );
      })}
    </tbody>
  );
}
