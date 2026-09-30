import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DB を毎回読む（本番ビルドで静的化されて PUT/POST が 405 になるのを防ぐ）
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const labels = await prisma.customFieldLabel.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json(labels);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { label } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: '項目名は必須です' }, { status: 400 });
  try {
    const count = await prisma.customFieldLabel.count();
    const item = await prisma.customFieldLabel.create({ data: { label: label.trim(), sortOrder: count } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'その項目名はすでに登録されています' }, { status: 409 });
  }
}
