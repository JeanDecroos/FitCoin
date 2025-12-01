import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import AdminPanel from '@/components/AdminPanel';

export default async function AdminPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/');
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (!user?.is_admin) {
    redirect('/dashboard');
  }

  return <AdminPanel />;
}

