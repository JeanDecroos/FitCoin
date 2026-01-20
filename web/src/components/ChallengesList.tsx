'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/supabase';
import { ArrowLeft, Calendar } from 'lucide-react';

type User = Tables<'users'>;
type Challenge = Tables<'challenges'> & {
  user: User;
};

export default function ChallengesList() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
    fetchEndDate();
  }, []);

  useEffect(() => {
    if (endDate) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      updateTimeRemaining();
      return () => clearInterval(interval);
    }
  }, [endDate]);

  function updateTimeRemaining() {
    if (!endDate) return;
    
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Challenge ended');
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    } else if (minutes > 0) {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${seconds}s`);
    }
  }

  async function fetchEndDate() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('timestamp_value')
      .eq('key', 'challenge_end_date')
      .single();

    if (!error && data?.timestamp_value) {
      setEndDate(new Date(data.timestamp_value));
    }
  }

  async function fetchChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        user:users!challenges_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching challenges:', error);
    } else {
      setChallenges((data as any) || []);
    }
    setLoading(false);
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">All Challenges</h1>
              <p className="text-gray-400">View all challenges</p>
            </div>
          </div>
          {endDate && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-400">Challenge End Date</div>
                  <div className="font-semibold">
                    {endDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {timeRemaining && (
                    <div className="text-sm text-yellow-400 mt-1">
                      {timeRemaining} remaining
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {challenge.user.name}
                    </h2>
                    <div className="space-y-2 text-gray-300">
                      <div>
                        <span className="font-semibold text-blue-400">Biological Goal:</span>{' '}
                        {challenge.dexa_goal}
                      </div>
                      <div>
                        <span className="font-semibold text-purple-400">Functional Goal:</span>{' '}
                        {challenge.functional_goal}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No challenges found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
