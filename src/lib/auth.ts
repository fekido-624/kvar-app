import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { UserRole } from '@/lib/types';

const SESSION_COOKIE = 'accesspilot_session';
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
};

export type SafeUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
};

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
};

export const toSafeUser = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  createdAt: Date;
}): SafeUser => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  username: user.username,
  role: user.role as UserRole,
  createdAt: user.createdAt.toISOString(),
});

export const createSession = async (userId: string) => {
  const token = await new SignJWT({ userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ONE_WEEK_SECONDS}s`)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK_SECONDS,
  });
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};

export const getSessionUserId = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.userId !== 'string') return null;
    return payload.userId;
  } catch {
    return null;
  }
};

export const getCurrentUser = async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return toSafeUser(user);
};

export const requireCurrentUser = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
};
