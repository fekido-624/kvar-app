import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSession, toSafeUser } from '@/lib/auth';

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const passwordOk = await compare(password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({ user: toSafeUser(user) });
}
