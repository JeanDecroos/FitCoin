import { createServerSupabaseClient } from './supabase';

// Get the current Supabase auth user
export async function getSupabaseAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

// Get the user record linked to the current auth user
export async function getUserFromAuth() {
  const authUser = await getSupabaseAuthUser();
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

// Get the current user ID (linked user record ID)
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getUserFromAuth();
  return user?.id || null;
}

// Link an auth user to a user record
export async function linkAuthUserToUser(authUserId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  // Check if user is already linked
  const { data: existingUser } = await supabase
    .from('users')
    .select('auth_user_id')
    .eq('id', userId)
    .single();

  if (existingUser?.auth_user_id) {
    throw new Error('User is already linked to an auth account');
  }

  // Check if auth user is already linked to another user
  const { data: existingLink } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();

  if (existingLink) {
    throw new Error('Auth account is already linked to a user');
  }

  // Link the auth user to the user record
  const { error } = await supabase
    .from('users')
    .update({ auth_user_id: authUserId })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  return { success: true };
}

// Backward compatibility functions (kept for transition period)
export async function setUserId(userId: string) {
  // This is now handled by Supabase auth, but keeping for compatibility
  // In practice, this should not be used anymore
  console.warn('setUserId is deprecated. Use Supabase auth instead.');
}

export async function clearUserId() {
  // This is now handled by Supabase auth, but keeping for compatibility
  console.warn('clearUserId is deprecated. Use Supabase signOut instead.');
}

