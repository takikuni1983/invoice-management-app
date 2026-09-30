// 一覧画面の並び替え（?sort=キー&dir=asc|desc）

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string | null;
  dir: SortDir;
}

export function parseSort(sort: string | undefined, dir: string | undefined, allowed: readonly string[]): SortState {
  const key = sort && allowed.includes(sort) ? sort : null;
  return { key, dir: dir === 'asc' ? 'asc' : 'desc' };
}

/** 検索条件などを保ったまま URL のクエリを組み立てる（空の値は省く） */
export function buildQuery(params: Record<string, string | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : '';
}
