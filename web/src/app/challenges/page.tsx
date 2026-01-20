import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import ChallengesList from '@/components/ChallengesList';

export default async function ChallengesPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  return <ChallengesList />;
}
