'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/actions';
import { Tables } from '@/types/supabase';
import { ArrowLeft, User, Target, Lock, Coins, Mail, LogOut, Eye } from 'lucide-react';

type User = Tables<'users'>;
type Challenge = Tables<'challenges'> | null;

interface SettingsContentProps {
  user: User;
  challenge: Challenge;
}

export default function SettingsContent({ user, challenge }: SettingsContentProps) {
  const router = useRouter();

  async function handleSignOut() {
    const result = await signOutAction();
    if (result.success) {
      router.push('/login');
      router.refresh();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-400">Manage your account and view your goals</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-900" />
              </div>
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <div className="text-white text-lg font-semibold">{user.name}</div>
              </div>
              
              {user.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <div className="text-white text-lg">{user.email}</div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Balance
                </label>
                <div className="text-white text-lg font-semibold flex items-center gap-2">
                  <span>{user.balance.toLocaleString()}</span>
                  <span className="text-yellow-400">FitCoins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-gray-900" />
              </div>
              <h2 className="text-2xl font-bold text-white">My Goals</h2>
            </div>

            {challenge ? (
              <div className="space-y-6">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-400">Goals are locked and cannot be changed. Contact Bart-Jan, Joris or Thomas to change your goals.</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-400 mb-2">
                        Biological Goal
                      </label>
                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-white">
                        {challenge.dexa_goal}
                      </div>
                      {challenge.dexa_status && challenge.dexa_status !== 'PENDING' && (
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
                      {challenge.functional_status && challenge.functional_status !== 'PENDING' && (
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(challenge.functional_status)}`}>
                          {challenge.functional_status}
                        </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                <Target className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">You haven't set your goals yet.</p>
                <Link
                  href="/goals"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
                >
                  <Target className="w-5 h-5" />
                  Set Your Goals
                </Link>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-900" />
              </div>
              <h2 className="text-2xl font-bold text-white">Account Actions</h2>
            </div>
            
            <div className="space-y-4">
              <Link
                href="/forgot-password"
                className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center"
              >
                Change Password
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
