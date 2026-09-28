import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const info = await prisma.companyInfo.upsert({
    where: { id: 1 },
    create: { id: 1, companyName: '' },
    update: {},
  });
  return NextResponse.json(info);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const info = await prisma.companyInfo.upsert({
    where: { id: 1 },
    create: { id: 1, ...body },
    update: body,
  });
  return NextResponse.json(info);
}
