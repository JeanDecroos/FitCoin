import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  // Check for session
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has set goals
  if (!user.goals_set) {
    redirect('/goals');
  }

  redirect('/dashboard');
}
