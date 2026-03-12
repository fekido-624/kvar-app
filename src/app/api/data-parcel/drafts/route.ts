import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const DataParcelDraftSchema = z.object({
  namaCustomer: z.string().min(1, 'Nama Pelanggan is required'),
  alamat: z.string().optional().default(''),
  poskod: z.string().optional().default(''),
  kv: z.string().min(1, 'KV is required'),
  noPhone: z.string().min(1, 'No. Telefon is required'),
  noOrder: z.string().min(1, 'No Order is required'),
  bilanganParcel: z.number().int().min(1),
});

const ensureDataParcelDraftTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DataParcelDraft" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "namaCustomer" TEXT NOT NULL,
      "alamat" TEXT NOT NULL DEFAULT '',
      "poskod" TEXT NOT NULL DEFAULT '',
      "kv" TEXT NOT NULL,
      "noPhone" TEXT NOT NULL,
      "noOrder" TEXT NOT NULL,
      "bilanganParcel" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export async function GET() {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDataParcelDraftTable();

  const drafts = (await prisma.$queryRawUnsafe(`
    SELECT
      "id",
      "namaCustomer",
      "alamat",
      "poskod",
      "kv",
      "noPhone",
      "noOrder",
      "bilanganParcel",
      "createdAt",
      "updatedAt"
    FROM "DataParcelDraft"
    ORDER BY "createdAt" DESC
  `)) as Array<{
    id: string;
    namaCustomer: string;
    alamat: string;
    poskod: string;
    kv: string;
    noPhone: string;
    noOrder: string;
    bilanganParcel: number;
    createdAt: string;
    updatedAt: string;
  }>;

  return NextResponse.json({ drafts });
}

export async function POST(request: Request) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDataParcelDraftTable();

  const json = await request.json().catch(() => null);
  const parsed = DataParcelDraftSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const id = randomUUID();
    const nowIso = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "DataParcelDraft" (
        "id",
        "namaCustomer",
        "alamat",
        "poskod",
        "kv",
        "noPhone",
        "noOrder",
        "bilanganParcel",
        "createdAt",
        "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      id,
      data.namaCustomer,
      data.alamat,
      data.poskod,
      data.kv,
      data.noPhone,
      data.noOrder,
      data.bilanganParcel,
      nowIso,
      nowIso
    );

    const draft = {
      id,
      namaCustomer: data.namaCustomer,
      alamat: data.alamat,
      poskod: data.poskod,
      kv: data.kv,
      noPhone: data.noPhone,
      noOrder: data.noOrder,
      bilanganParcel: data.bilanganParcel,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          (error as Error)?.message?.trim() || 'Unable to save data parcel draft.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDataParcelDraftTable();

  try {
    const deletedCount = await prisma.$executeRawUnsafe(`DELETE FROM "DataParcelDraft"`);
    return NextResponse.json({ deletedCount });
  } catch {
    return NextResponse.json(
      { error: 'Unable to clear data parcel drafts.' },
      { status: 500 }
    );
  }
}
