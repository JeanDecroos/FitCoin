import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import LoginPage from '@/components/LoginPage';

export default async function Home() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return <LoginPage />;
  }

  // Check if user has set goals
  const { data: user } = await supabase
    .from('users')
    .select('goals_set')
    .eq('id', userId)
    .single();

  if (!user?.goals_set) {
    redirect('/goals');
  }

  redirect('/dashboard');
}
