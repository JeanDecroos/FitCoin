'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';
import Link from 'next/link';

type User = Tables<'users'>;
type Challenge = Tables<'challenges'> & {
  user: User;
};

export default function ChallengesFeed() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  async function fetchChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        user:users!challenges_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching challenges:', error);
    } else {
      setChallenges((data as any) || []);
    }
    setLoading(false);
  }

  function getStatusBadge(status: string) {
    if (status === 'PASSED') {
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
    if (status === 'FAILED') {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Challenges</h2>
        <div className="text-gray-400 text-center py-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Challenges</h2>
        <Link
          href="/challenges"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {challenges.length > 0 ? (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
            >
              <div className="mb-2">
                <h3 className="text-white font-semibold">{challenge.user.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-blue-400 font-medium">DEXA:</span>{' '}
                  <span className="text-gray-300 truncate block">{challenge.dexa_goal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(challenge.dexa_status)}`}>
                    {challenge.dexa_status}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-purple-400 font-medium">Functional:</span>{' '}
                  <span className="text-gray-300 truncate block">{challenge.functional_goal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadge(challenge.functional_status)}`}>
                    {challenge.functional_status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center py-4">No challenges found.</div>
        )}
      </div>
    </div>
  );
}
