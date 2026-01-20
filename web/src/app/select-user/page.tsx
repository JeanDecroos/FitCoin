'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { linkAuthUserToUserAction } from '@/app/actions';
import { supabase } from '@/lib/supabase';
import { User } from 'lucide-react';

export default function SelectUserPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Array<{ id: string; name: string; auth_user_id: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, auth_user_id')
          .order('name');

        if (error) {
          console.error('Error fetching users:', error);
          setError(`Error loading users: ${error.message}`);
        } else {
          // Filter out users that are already linked to another auth account
          const availableUsers = (data || []).filter(user => !user.auth_user_id);
          setUsers(availableUsers);
        }
      } catch (error: any) {
        console.error('Failed to fetch users:', error);
        setError(`Failed to connect to database: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  async function handleLinkUser() {
    if (!selectedUserId) return;

    setError('');
    setLinking(true);

    try {
      const result = await linkAuthUserToUserAction(selectedUserId);
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || 'Failed to link user');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLinking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
            <h1 className="text-2xl font-bold text-white mb-4">No Available Users</h1>
            <p className="text-gray-400 mb-6">
              All users are already linked to accounts. Please contact an administrator.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <span className="text-2xl font-bold text-gray-900">₿</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Select Your User</h1>
            <p className="text-gray-400">Choose which user you are</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">Choose your name...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLinkUser}
              disabled={!selectedUserId || linking}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {linking ? 'Linking...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
