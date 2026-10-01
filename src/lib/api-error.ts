// API ルートの例外を JSON のエラーレスポンスに変換する
// （例外を投げっぱなしにすると中身が空の 500 になり、画面側で JSON の読み込みに失敗して原因が分からなくなる）
import { Prisma } from '@prisma/client';
import { NumberTakenError } from '@/lib/numbering';

export function apiErrorResponse(err: unknown): Response {
  if (err instanceof NumberTakenError) {
    return Response.json({ error: err.message }, { status: 400 });
  }

  console.error('[API]', err);

  // P2021: テーブルがない / P2022: 列がない → DB の更新（マイグレーション）が済んでいない
  if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2021' || err.code === 'P2022')) {
    return Response.json(
      {
        error:
          'データベースの更新が必要です。アプリを止めて「npx prisma migrate deploy」と「npx prisma generate」を実行してから起動し直してください（start-server.bat なら自動で行います）。',
      },
      { status: 500 },
    );
  }

  const message = err instanceof Error ? err.message.trim().split('\n').pop() : String(err);
  return Response.json({ error: `保存に失敗しました（${message}）` }, { status: 500 });
}
