'use client';

import { useEffect, useRef, useState } from 'react';

// 行のドラッグ並べ替え（詳細画面の書類プレビューと編集画面の明細で共通）
// - つまみの onPointerDown で開始。ドラッグ中は行の並びはそのままで、つかんだ行はポインター（指）に追従し、
//   ほかの行は入る位置を空けるようにずれる。離した時点で onDrop(from, to) を呼ぶ
// - 行の位置は getBoundingClientRect（画面上の座標）で測るので、FitToWidth で縮小表示されていてもずれない
// - 画面の上下端までドラッグすると自動スクロール

interface Drag {
  from: number;
  /** 今離したら入る位置 */
  to: number;
  /** ポインターの移動量（画面上の px） */
  dy: number;
  startY: number;
  /** ドラッグ開始時の各行の位置（ページ座標、画面上の px） */
  rows: { top: number; height: number }[];
  /** 縮小率（画面上の px ÷ 要素内の px） */
  scale: number;
}

const EDGE = 60;

export function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function useRowDrag(count: number, onDrop: (from: number, to: number) => void) {
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const setRowRef = (index: number) => (el: HTMLElement | null) => { rowRefs.current[index] = el; };

  function startDrag(e: React.PointerEvent, index: number) {
    if (e.button !== 0 || count < 2) return;
    e.preventDefault();
    const rows = rowRefs.current.slice(0, count).map(el => {
      const r = el!.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    const el = rowRefs.current[index]!;
    setDrag({ from: index, to: index, dy: 0, startY: e.clientY + window.scrollY, rows, scale: rows[index].height / (el.offsetHeight || 1) });
  }

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (e.clientY < EDGE) window.scrollBy(0, -12);
      else if (e.clientY > window.innerHeight - EDGE) window.scrollBy(0, 12);
      setDrag(d => {
        if (!d) return d;
        const dy = e.clientY + window.scrollY - d.startY;
        // つかんだ行の中心が、ほかの行の中心を越えたらその位置へ
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
      if (d && d.to !== d.from) onDropRef.current(d.from, d.to);
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
  }, [dragging]);

  /** 各行のずらし量（要素内の px） */
  function offsetOf(index: number) {
    if (!drag) return 0;
    const { from, to, rows, scale } = drag;
    if (index === from) return drag.dy / scale;
    // つかんだ行の高さ＋行間のぶんだけ、ほかの行をずらす
    const next = rows[from + 1] ?? rows[from - 1];
    const gap = next ? Math.abs(next.top - rows[from].top) - (next.top > rows[from].top ? rows[from].height : next.height) : 0;
    const shift = (rows[from].height + gap) / scale;
    if (to < from && index >= to && index < from) return shift;
    if (to > from && index > from && index <= to) return -shift;
    return 0;
  }

  /** 行に付けるスタイル（位置のずらしとアニメーション） */
  function rowStyle(index: number): React.CSSProperties {
    const active = drag?.from === index;
    const offset = offsetOf(index);
    return {
      position: 'relative',
      zIndex: active ? 10 : undefined,
      transform: offset ? `translateY(${offset}px)` : undefined,
      // ほかの行はなめらかに場所を空ける。つかんだ行はポインターにそのまま追従
      transition: drag && !active ? 'transform 150ms ease' : undefined,
    };
  }

  return {
    /** ドラッグ中の行の位置（ドラッグしていなければ null） */
    activeIndex: drag?.from ?? null,
    isDragging: dragging,
    setRowRef,
    startDrag,
    rowStyle,
  };
}
