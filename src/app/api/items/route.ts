import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DB を毎回読む（本番ビルドで静的化されて PUT/POST が 405 になるのを防ぐ）
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await prisma.itemMaster.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(items);
  } catch (e) {
    console.error('[items GET]', e);
    return NextResponse.json({ error: 'データ取得に失敗しました。npx prisma migrate dev を実行してください。' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '品目名は必須です' }, { status: 400 });
  try {
    const item = await prisma.itemMaster.create({ data: { name: name.trim() } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'その品目名はすでに登録されています' }, { status: 409 });
  }
}
