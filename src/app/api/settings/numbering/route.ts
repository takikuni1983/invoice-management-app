import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DOC_TYPES, DocType, getNumberConfig, nextNumber } from '@/lib/numbering';
import { apiErrorResponse } from '@/lib/api-error';

// DB を毎回読む（本番ビルドで静的化されて PUT が 405 になるのを防ぐ）
export const dynamic = 'force-dynamic';

async function listSettings() {
  return Promise.all(
    DOC_TYPES.map(async (d) => ({
      docType: d.type,
      label: d.label,
      ...(await getNumberConfig(prisma, d.type)),
      next: await nextNumber(prisma, d.type),
    })),
  );
}

export async function GET() {
  return NextResponse.json(await listSettings());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!Array.isArray(body)) return NextResponse.json({ error: '形式が正しくありません' }, { status: 400 });

  const valid = new Set(DOC_TYPES.map(d => d.type));
  const rows: { docType: DocType; prefix: string; lastNumber: number; digits: number }[] = [];
  for (const r of body) {
    const lastNumber = Number(r?.lastNumber);
    const digits = Number(r?.digits);
    if (!valid.has(r?.docType)) return NextResponse.json({ error: '書類の種類が正しくありません' }, { status: 400 });
    if (typeof r.prefix !== 'string' || /\s/.test(r.prefix) || r.prefix.length > 20) {
      return NextResponse.json({ error: '接頭辞は空白なし・20文字以内で入力してください' }, { status: 400 });
    }
    if (!Number.isInteger(lastNumber) || lastNumber < 0) {
      return NextResponse.json({ error: '最新の番号は 0 以上の整数で入力してください' }, { status: 400 });
    }
    if (!Number.isInteger(digits) || digits < 1 || digits > 10) {
      return NextResponse.json({ error: '桁数は 1〜10 で入力してください' }, { status: 400 });
    }
    rows.push({ docType: r.docType, prefix: r.prefix, lastNumber, digits });
  }

  try {
    await prisma.$transaction(
      rows.map((r) =>
        prisma.numberSetting.upsert({
          where: { docType: r.docType },
          create: r,
          update: { prefix: r.prefix, lastNumber: r.lastNumber, digits: r.digits },
        }),
      ),
    );
    return NextResponse.json(await listSettings());
  } catch (err) {
    return apiErrorResponse(err);
  }
}
