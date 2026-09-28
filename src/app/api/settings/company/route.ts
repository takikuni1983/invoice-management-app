import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const info = await prisma.companyInfo.upsert({
      where: { id: 1 },
      create: { id: 1, companyName: '' },
      update: {},
    });
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const info = await prisma.companyInfo.upsert({
      where: { id: 1 },
      create: { id: 1, ...body },
      update: body,
    });
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }
}
