'use client';

import { useEffect, useState } from 'react';

// 品目マスタの名前一覧（明細の入力候補）
export function useMasterItems() {
  const [masterItems, setMasterItems] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/items');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setMasterItems(data.map((d: any) => d.name));
      } catch {}
    })();
  }, []);
  return masterItems;
}
