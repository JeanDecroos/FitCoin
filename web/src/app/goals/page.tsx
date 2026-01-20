import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import GoalsForm from '@/components/GoalsForm';

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

  if (user?.goals_set) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <GoalsForm userId={userId} />
      </div>
    </div>
  );
}

