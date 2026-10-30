'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical } from 'lucide-react';
import { docFont } from '@/lib/doc-fonts';
import { responseError } from '@/lib/response-error';
import { useRowDrag, moveItem } from '@/components/ui/useRowDrag';

// 書類プレビューの明細行。左端のつまみをドラッグ（またはつまみを選んで ↑↓ キー）で並べ替え、離した時点で保存する。
// ドラッグの動き（行がポインターについて動く・ほかの行が場所を空ける）は useRowDrag で編集画面と共通。
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

export default function SortableLineItems({ lineItems, showTaxColumn, reorder, border, gray }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(lineItems);
  const [saving, setSaving] = useState(false);

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

  function moveTo(from: number, to: number) {
    const next = moveItem(items, from, to);
    setItems(next);
    save(next, items);
  }

  const { activeIndex, isDragging, setRowRef, startDrag, rowStyle } = useRowDrag(items.length, moveTo);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (saving || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const to = e.key === 'ArrowUp' ? index - 1 : index + 1;
    if (to >= 0 && to < items.length) moveTo(index, to);
  }

  return (
    <tbody style={{ opacity: saving ? 0.6 : 1 }}>
      {items.map((item, index) => {
        const active = activeIndex === index;
        const cell = { ...cellPad, borderBottom: `0.5pt solid ${border}` };
        return (
          <tr
            key={item.id}
            ref={setRowRef(index)}
            className="group"
            style={{
              ...rowStyle(index),
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
                  onPointerDown={(e) => { if (!saving) startDrag(e, index); }}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  className="absolute flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 group-hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-gray-700"
                  style={{
                    left: '-32pt', top: '5pt', width: '24pt', height: '26pt',
                    touchAction: 'none', cursor: active ? 'grabbing' : 'grab',
                    color: active ? '#2563eb' : undefined,
                    backgroundColor: active ? '#eff6ff' : undefined,
                    // ドラッグ中はほかの行のつまみを隠す（動いている行の横にのぞかないように）
                    opacity: isDragging && !active ? 0 : 1,
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
