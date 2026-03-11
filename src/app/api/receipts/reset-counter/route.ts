import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const RECEIPT_COUNTER_KEY = 'receipt_no_resit';

const ResetCounterSchema = z.object({
  startNo: z.number().int().min(1).max(999999),
});

const formatNoResit = (value: number) => String(value).padStart(4, '0');

const ensureCounterTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReceiptSequence" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "nextNo" INTEGER NOT NULL DEFAULT 1,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export async function POST(request: Request) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = ResetCounterSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  try {
    const { startNo } = parsed.data;

    await ensureCounterTable();

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "ReceiptSequence" ("key", "nextNo", "updatedAt")
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT("key") DO UPDATE SET
        "nextNo" = excluded."nextNo",
        "updatedAt" = CURRENT_TIMESTAMP
    `,
      RECEIPT_COUNTER_KEY,
      startNo
    );

    return NextResponse.json({
      message: 'No siri resit berjaya direset.',
      nextNoResit: formatNoResit(startNo),
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) || 'Tidak dapat reset no siri resit.' },
      { status: 500 }
    );
  }
}
