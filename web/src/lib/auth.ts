import { createServerSupabaseClient } from './supabase';

// Get the current Supabase Auth user
export async function getCurrentAuthUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

// Get the current user ID from Supabase Auth session
export async function getCurrentUserId(): Promise<string | null> {
  const authUser = await getCurrentAuthUser();
  return authUser?.id || null;
}

// Get the current user record from public.users table linked via auth_user_id
export async function getCurrentUser() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

// Helper function for backward compatibility (Supabase handles sessions automatically)
export async function setSession(userId: string) {
  // Sessions are handled by Supabase Auth automatically
  // This is kept for backward compatibility but does nothing
  // The session is set when calling supabase.auth.signUp() or supabase.auth.signIn()
}

// Clear session (sign out from Supabase Auth)
export async function clearSession() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
