import { redirect } from 'next/navigation';
import { getSupabaseAuthUser, getUserFromAuth } from '@/lib/auth';

export default async function Home() {
  // Check for Supabase auth session
  const authUser = await getSupabaseAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  // Check if user has linked user record
  const user = await getUserFromAuth();

  if (!user) {
    redirect('/select-user');
  }

  // Check if user has set goals
  if (!user.goals_set) {
    redirect('/goals');
  }

  redirect('/dashboard');
}
