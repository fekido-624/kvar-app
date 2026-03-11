import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCurrentUser, toSafeUser } from '@/lib/auth';

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).optional(),
  password: z.string().min(8).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ user: toSafeUser(user) });
}

export async function PATCH(request: Request, { params }: Params) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  if (data.role && currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    passwordHash?: string;
  } = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password) updateData.passwordHash = await hash(data.password, 10);

  try {
    const user = await prisma.user.update({ where: { id }, data: updateData });
    return NextResponse.json({ user: toSafeUser(user) });
  } catch {
    return NextResponse.json({ error: 'Update failed. Username/email may already exist.' }, { status: 409 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const currentUser = await requireCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  if (currentUser.id === id) {
    return NextResponse.json({ error: 'Cannot delete current logged-in user.' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
