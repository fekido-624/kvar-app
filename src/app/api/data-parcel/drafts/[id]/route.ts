import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

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

export async function DELETE(_: Request, { params }: Params) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDataParcelDraftTable();

  const { id } = await params;

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "DataParcelDraft" WHERE "id" = ?`,
      id
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete data parcel draft' }, { status: 500 });
  }
}
