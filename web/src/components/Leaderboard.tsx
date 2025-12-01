'use client';

import { Tables } from '@/types/supabase';
import { Trophy, Medal, Award } from 'lucide-react';

type User = Tables<'users'>;

interface LeaderboardProps {
  users: User[];
  currentUserId: string;
}

export default function Leaderboard({ users, currentUserId }: LeaderboardProps) {
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-400" />;
    return <span className="text-gray-500 font-semibold">#{index + 1}</span>;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Leaderboard</h2>
      <div className="space-y-2">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              user.id === currentUserId
                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
                : 'bg-gray-700/30 hover:bg-gray-700/50'
            } transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(index)}
              </div>
              <div>
                <div className="text-white font-medium">{user.name}</div>
                {user.id === currentUserId && (
                  <div className="text-xs text-yellow-400">You</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold">{user.balance.toLocaleString()}</div>
              <div className="text-xs text-gray-400">FC</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

