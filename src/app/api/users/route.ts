import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCurrentUser, toSafeUser } from '@/lib/auth';

const CreateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']),
});

export async function GET() {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ users: users.map(toSafeUser) });
}

export async function POST(request: Request) {
  const currentUser = await requireCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const data = parsed.data;

  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
  });

  if (exists) {
    return NextResponse.json({ error: 'Username or email already exists.' }, { status: 409 });
  }

  const passwordHash = await hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      username: data.username,
      passwordHash,
      role: data.role,
    },
  });

  return NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
}
