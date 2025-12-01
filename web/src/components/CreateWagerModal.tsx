'use client';

import { useState } from 'react';
import { createWagerAction } from '@/app/actions';
import { Tables } from '@/types/supabase';
import { X } from 'lucide-react';

type User = Tables<'users'>;

interface CreateWagerModalProps {
  userId: string;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWagerModal({
  userId,
  users,
  onClose,
  onSuccess,
}: CreateWagerModalProps) {
  const [targetUserId, setTargetUserId] = useState('');
  const [challengeType, setChallengeType] = useState<'DEXA' | 'FUNCTIONAL'>('DEXA');
  const [prediction, setPrediction] = useState<'PASS' | 'FAIL'>('FAIL');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUserId || !amount) {
      alert('Please fill in all fields');
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await createWagerAction(userId, targetUserId, challengeType, prediction, amountNum);
      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to create wager');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Place a Bet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bet On
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            >
              <option value="">Select a colleague...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Challenge Type
            </label>
            <select
              value={challengeType}
              onChange={(e) => setChallengeType(e.target.value as 'DEXA' | 'FUNCTIONAL')}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="DEXA">DEXA / Physique</option>
              <option value="FUNCTIONAL">Functional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prediction
            </label>
            <select
              value={prediction}
              onChange={(e) => setPrediction(e.target.value as 'PASS' | 'FAIL')}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="PASS">They will PASS</option>
              <option value="FAIL">They will FAIL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (FitCoins)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="50"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing...' : 'Place Bet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

