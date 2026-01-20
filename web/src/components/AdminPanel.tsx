'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resolveChallengeAction, approveFundRequestAction, rejectFundRequestAction, unlinkAllUsersAction } from '@/app/actions';
import { Tables } from '@/types/supabase';
import { ArrowLeft, CheckCircle, XCircle, Coins, X, Unlink } from 'lucide-react';

type User = Tables<'users'>;
type Challenge = Tables<'challenges'> & {
  user: User;
};
type FundRequest = Tables<'fund_requests'> & {
  user: User;
};

interface AdminPanelProps {
  userId: string;
}

export default function AdminPanel({ userId }: AdminPanelProps) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
    fetchFundRequests();
  }, []);

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
  }

  async function fetchFundRequests() {
    const { data, error } = await supabase
      .from('fund_requests')
      .select(`
        *,
        user:users!fund_requests_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fund requests:', error);
    } else {
      setFundRequests((data as any) || []);
    }
    setLoading(false);
  }

  async function handleApprove(requestId: string) {
    if (!confirm('Approve this fund request? The user will receive the FitCoins.')) {
      return;
    }

    try {
      await approveFundRequestAction(requestId, userId);
      fetchFundRequests();
      alert('Fund request approved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to approve fund request');
    }
  }

  async function handleReject(requestId: string) {
    const notes = prompt('Optional: Enter a reason for rejection:');
    if (notes === null) return; // User cancelled

    try {
      await rejectFundRequestAction(requestId, userId, notes || undefined);
      fetchFundRequests();
      alert('Fund request rejected.');
    } catch (error: any) {
      alert(error.message || 'Failed to reject fund request');
    }
  }

  async function handleResolve(
    userId: string,
    challengeType: 'DEXA' | 'FUNCTIONAL',
    status: 'PASSED' | 'FAILED'
  ) {
    if (!confirm(`Mark ${challengeType} challenge as ${status}? This will settle all related wagers.`)) {
      return;
    }

    try {
      await resolveChallengeAction(userId, challengeType, status);
      fetchChallenges();
      alert('Challenge resolved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to resolve challenge');
    }
  }

  async function handleUnlinkAllUsers() {
    if (!confirm('Are you sure you want to unlink all users? This will allow them to select their user again.')) {
      return;
    }

    try {
      await unlinkAllUsersAction();
      alert('All users have been unlinked successfully!');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to unlink users');
    }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400 mt-1">Resolve challenge outcomes & approve fund requests</p>
            </div>
          </div>
          <button
            onClick={handleUnlinkAllUsers}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            <Unlink className="w-4 h-4" />
            Unlink All Users
          </button>
        </div>

        {/* Fund Requests Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            Fund Requests
          </h2>
          <div className="space-y-4">
            {fundRequests.filter((r) => r.status === 'PENDING').length > 0 ? (
              fundRequests
                .filter((r) => r.status === 'PENDING')
                .map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {request.user.name}
                        </h3>
                        <div className="space-y-2 text-gray-300">
                          <div>
                            <span className="font-semibold text-blue-400">Amount:</span>{' '}
                            €{Number(request.euro_amount).toFixed(2)}
                          </div>
                          <div>
                            <span className="font-semibold text-yellow-400">FitCoins:</span>{' '}
                            {request.fitcoin_amount.toLocaleString()} FC
                          </div>
                          <div className="text-sm text-gray-400">
                            Requested: {new Date(request.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center">
                <p className="text-gray-400">No pending fund requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Challenges Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Challenges</h2>
        </div>
        <div className="space-y-6">
          {challenges.map((challenge) => (
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
                      <span className="font-semibold text-blue-400">DEXA Goal:</span>{' '}
                      {challenge.dexa_goal}
                    </div>
                    <div>
                      <span className="font-semibold text-purple-400">Functional Goal:</span>{' '}
                      {challenge.functional_goal}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DEXA Challenge */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue-400">DEXA Challenge</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(challenge.dexa_status)}`}>
                      {challenge.dexa_status}
                    </span>
                  </div>
                  {challenge.dexa_status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(challenge.user_id, 'DEXA', 'PASSED')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Pass
                      </button>
                      <button
                        onClick={() => handleResolve(challenge.user_id, 'DEXA', 'FAILED')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Fail
                      </button>
                    </div>
                  )}
                </div>

                {/* Functional Challenge */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-400">Functional Challenge</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(challenge.functional_status)}`}>
                      {challenge.functional_status}
                    </span>
                  </div>
                  {challenge.functional_status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(challenge.user_id, 'FUNCTIONAL', 'PASSED')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Pass
                      </button>
                      <button
                        onClick={() => handleResolve(challenge.user_id, 'FUNCTIONAL', 'FAILED')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Fail
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {challenges.length === 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-gray-400">No challenges found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

