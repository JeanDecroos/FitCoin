'use client';

import Link from 'next/link';
import { Tables } from '@/types/supabase';
import { Target, Lock, ArrowLeft } from 'lucide-react';

type Challenge = Tables<'challenges'>;

interface ViewGoalsProps {
  challenge: Challenge;
}

export default function ViewGoals({ challenge }: ViewGoalsProps) {
  function getStatusBadge(status: string) {
    if (status === 'PASSED') {
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
    if (status === 'FAILED') {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
          <Target className="w-8 h-8 text-gray-900" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">My Goals</h1>
        <p className="text-gray-400">Your goals are locked and cannot be changed. Contact Bart-Jan, Joris or Thomas to change your goals.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-gray-400">Goals are locked. Contact Bart-Jan, Joris or Thomas to change your goals.</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-400 mb-2">
                Biological Goal
              </label>
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-white">
                {challenge.dexa_goal}
              </div>
              {challenge.dexa_status !== 'PENDING' && (
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(challenge.dexa_status)}`}>
                    {challenge.dexa_status}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-400 mb-2">
                Functional Goal
              </label>
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-white">
                {challenge.functional_goal}
              </div>
              {challenge.functional_status !== 'PENDING' && (
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(challenge.functional_status)}`}>
                    {challenge.functional_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            View Full Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
