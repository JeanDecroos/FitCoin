import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const supabase = await createServerSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('goals_set')
    .eq('id', userId)
    .single();

  if (!user?.goals_set) {
    redirect('/goals');
  }

  return <DashboardContent userId={userId} />;
}

