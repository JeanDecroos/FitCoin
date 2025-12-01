'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions';
import { supabase } from '@/lib/supabase';
import { User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  async function handleLogin() {
    if (!selectedUserId) return;

    try {
      await loginAction(selectedUserId);
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-white">Loading...</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">FitCoin Challenge</h1>
            <p className="text-gray-400">Select your name to continue</p>
          </div>

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
              onClick={handleLogin}
              disabled={!selectedUserId}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

