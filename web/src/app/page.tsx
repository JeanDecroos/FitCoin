import { redirect } from 'next/navigation';
import { getSupabaseAuthUser, getUserFromAuth } from '@/lib/auth';

export default async function Home() {
  // Check for Supabase auth session
  const authUser = await getSupabaseAuthUser();

  if (!authUser) {
    redirect('/login');
  }

  // Check if user has linked user record
  // Since users are now created during signup, this should always exist
  const user = await getUserFromAuth();

  if (!user) {
    // This should not happen if signup worked correctly
    // Redirect to login as a fallback
    redirect('/login');
  }

  // Check if user has set goals
  if (!user.goals_set) {
    redirect('/goals');
  }

  redirect('/dashboard');
}
