import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import GoalsForm from '@/components/GoalsForm';
import ViewGoals from '@/components/ViewGoals';

export default async function GoalsPage() {
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

  // Fetch challenge if goals are set
  const { data: challenge } = user?.goals_set
    ? await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        {user?.goals_set && challenge ? (
          <ViewGoals challenge={challenge} />
        ) : (
          <GoalsForm userId={userId} />
        )}
      </div>
    </div>
  );
}

