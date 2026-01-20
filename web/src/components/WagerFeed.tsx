'use client';

import { Tables } from '@/types/supabase';
import { counterWagerAction, cancelWagerAction } from '@/app/actions';
import { TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

type User = Tables<'users'>;
type Wager = Tables<'wagers'> & {
  creator: User;
  target_user: User;
  counter_user: User | null;
};

interface WagerFeedProps {
  wagers: Wager[];
  userId: string;
  onUpdate: () => void;
}

export default function WagerFeed({ wagers, userId, onUpdate }: WagerFeedProps) {
  async function handleCounter(wagerId: string) {
    if (!confirm('Are you sure you want to counter this bet?')) return;

    try {
      await counterWagerAction(wagerId, userId);
      onUpdate();
    } catch (error: any) {
      alert(error.message || 'Failed to counter bet');
    }
  }

  async function handleCancel(wagerId: string) {
    if (!confirm('Are you sure you want to cancel this bet? You will get a refund.')) return;

    try {
      await cancelWagerAction(wagerId, userId);
      onUpdate();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel bet');
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      OPEN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      MATCHED: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      SETTLED: 'bg-green-500/20 text-green-400 border-green-500/50',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return badges[status as keyof typeof badges] || badges.OPEN;
  }

  function formatChallengeType(type: string): string {
    if (type === 'DEXA') return 'Biological';
    if (type === 'FUNCTIONAL') return 'Functional';
    if (type === 'BOTH') return 'Both';
    return type;
  }

  if (wagers.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Live Wager Feed</h2>
        <p className="text-gray-400 text-center py-8">No wagers yet. Be the first to place a bet!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Live Wager Feed</h2>
      <div className="space-y-4">
        {wagers.map((wager) => (
          <div
            key={wager.id}
            className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-white">
                  <span className="font-semibold text-yellow-400">{wager.creator.name}</span>
                  {' bet '}
                  <span className="font-semibold text-orange-400">{wager.amount} FC</span>
                  {' that '}
                  <span className="font-semibold">{wager.target_user.name}</span>
                  {' will '}
                  <span className={`font-semibold ${wager.prediction === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                    {wager.prediction}
                  </span>
                  {' their '}
                  <span className="font-semibold text-blue-400">{formatChallengeType(wager.challenge_type)}</span>
                  {' goal'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(wager.status)}`}>
                {wager.status}
              </span>
            </div>

            {wager.status === 'MATCHED' && wager.counter_user && (
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span>
                  Countered by <span className="font-semibold text-blue-400">{wager.counter_user.name}</span>
                </span>
              </div>
            )}

            {wager.status === 'SETTLED' && wager.winner_id && (
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                {wager.winner_id === wager.creator_id ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span>
                  Winner: <span className="font-semibold text-green-400">
                    {wager.winner_id === wager.creator_id ? wager.creator.name : wager.counter_user?.name}
                  </span>
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {wager.status === 'OPEN' && wager.creator_id !== userId && (
                <button
                  onClick={() => handleCounter(wager.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Counter this Bet
                </button>
              )}
              {wager.status === 'OPEN' && wager.creator_id === userId && (
                <button
                  onClick={() => handleCancel(wager.id)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

