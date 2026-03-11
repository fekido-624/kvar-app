import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const CreatePerkaraSchema = z.object({
  label: z.string().min(1, 'Label is required'),
});

export async function GET() {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const options = await prisma.receiptPerkaraOption.findMany({
      orderBy: { label: 'asc' },
    });

    return NextResponse.json({ options });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load perkara options: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = CreatePerkaraSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const label = parsed.data.label.trim();
  if (!label) {
    return NextResponse.json({ error: 'Perkara tidak boleh kosong.' }, { status: 400 });
  }

  try {
    const exists = await prisma.receiptPerkaraOption.findUnique({ where: { label } });
    if (exists) {
      return NextResponse.json({ error: 'Perkara sudah ada dalam menu.', option: exists }, { status: 409 });
    }

    const option = await prisma.receiptPerkaraOption.create({
      data: { label },
    });

    return NextResponse.json({ option }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Gagal simpan perkara: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
