import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import SettingsContent from '@/components/SettingsContent';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const supabase = await createServerSupabaseClient();
  
  // Fetch user data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch user's challenge/goals
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!user) {
    redirect('/login');
  }

  return <SettingsContent user={user} challenge={challenge || null} />;
}
