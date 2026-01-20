'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOutAction } from '@/app/actions';
import { Tables } from '@/types/supabase';
import WagerFeed from './WagerFeed';
import ChallengesFeed from './ChallengesFeed';
import CreateWagerModal from './CreateWagerModal';
import { Coins, Plus, Shield, LogOut, Target, Settings } from 'lucide-react';

type User = Tables<'users'>;
type Wager = Tables<'wagers'> & {
  creator: User;
  target_user: User;
  counter_user: User | null;
};

interface DashboardContentProps {
  userId: string;
  isAdmin: boolean;
}

export default function DashboardContent({ userId, isAdmin }: DashboardContentProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function handleSignOut() {
    const result = await signOutAction();
    if (result.success) {
      router.push('/login');
      router.refresh();
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [userId]);

  async function fetchData() {
    try {
      // Fetch current user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userData) setUser(userData);

      // Fetch all users for wager creation
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('balance', { ascending: false });

      if (usersData) setUsers(usersData);

      // Fetch wagers with related user data
      const { data: wagersData, error } = await supabase
        .from('wagers')
        .select(`
          *,
          creator:users!wagers_creator_id_fkey(*),
          target_user:users!wagers_target_user_id_fkey(*),
          counter_user:users!wagers_counter_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching wagers:', error);
      } else {
        setWagers((wagersData as any) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">FitCoin Challenge</h1>
            {user && (
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-xl font-semibold">{user.balance.toLocaleString()} FC</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/challenges"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Target className="w-5 h-5" />
              Challenges
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Shield className="w-5 h-5" />
                Admin
              </Link>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              Place Bet
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wager Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <WagerFeed wagers={wagers} userId={userId} onUpdate={fetchData} />
          </div>

          {/* Challenges Feed - Takes 1 column */}
          <div className="lg:col-span-1">
            <ChallengesFeed />
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateWagerModal
          userId={userId}
          users={users.filter((u) => u.id !== userId)}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

