'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  /** 書類レイアウトの基準幅(px)。これより狭い画面では全体を縮小して表示する */
  width: number;
  children: React.ReactNode;
}

// 見積書などの書類プレビューを、レイアウトを崩さずに画面幅へ縮小する
export default function FitToWidth({ width, children }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const s = Math.min(1, outer.clientWidth / width);
      setScale(s);
      setHeight(s < 1 ? inner.offsetHeight * s : undefined);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outerRef} style={{ height }} className="overflow-hidden">
      <div
        ref={innerRef}
        style={scale < 1 ? { width, transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
