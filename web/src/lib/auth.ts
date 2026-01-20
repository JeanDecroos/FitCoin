import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './supabase';

const SESSION_COOKIE_NAME = 'fitcoin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Get session from cookies
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

// Set session cookie with user ID
export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

// Clear session cookie
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get the current user ID from session
export async function getCurrentUserId(): Promise<string | null> {
  const userId = await getSession();
  return userId;
}

// Get the current user record from session
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}
