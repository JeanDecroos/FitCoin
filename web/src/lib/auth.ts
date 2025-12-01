import { cookies } from 'next/headers';

const USER_ID_COOKIE = 'fitcoin_user_id';

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_ID_COOKIE)?.value;
  return userId || null;
}

export async function setUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function clearUserId() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_ID_COOKIE);
}

