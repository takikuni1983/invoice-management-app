// 失敗したレスポンスから画面に出すエラーメッセージを取り出す（本文が JSON でなくても落ちない）
export async function responseError(res: Response, fallback = '保存に失敗しました'): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {}
  return `${fallback}（HTTP ${res.status}）`;
}
