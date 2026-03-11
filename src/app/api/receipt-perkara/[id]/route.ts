import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.receiptPerkaraOption.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete perkara option' }, { status: 500 });
  }
}
