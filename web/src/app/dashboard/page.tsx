import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/');
  }

  const { data: user } = await supabase
    .from('users')
    .select('goals_set, is_admin')
    .eq('id', userId)
    .single();

  if (!user?.goals_set) {
    redirect('/goals');
  }

  return <DashboardContent userId={userId} isAdmin={user.is_admin} />;
}

