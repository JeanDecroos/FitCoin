'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChallengeAction } from '@/app/actions';
import { Target, Lock } from 'lucide-react';

interface GoalsFormProps {
  userId: string;
}

export default function GoalsForm({ userId }: GoalsFormProps) {
  const router = useRouter();
  const [dexaGoal, setDexaGoal] = useState('');
  const [functionalGoal, setFunctionalGoal] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dexaGoal.trim() || !functionalGoal.trim()) {
      alert('Please fill in both goals');
      return;
    }

    setLoading(true);
    try {
      const result = await createChallengeAction(userId, dexaGoal.trim(), functionalGoal.trim());
      if (result?.success) {
        router.refresh();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to set goals. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
          <Target className="w-8 h-8 text-gray-900" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Set Your Goals</h1>
        <p className="text-gray-400">Lock in your challenge goals to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Biological goal
          </label>
          <textarea
            value={dexaGoal}
            onChange={(e) => setDexaGoal(e.target.value)}
            placeholder="At this moment I have 25,7% body fat, and by the second DEXA scan, I want to go under 20% body fat."
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Functional goal
          </label>
          <textarea
            value={functionalGoal}
            onChange={(e) => setFunctionalGoal(e.target.value)}
            placeholder="Before the second DEXA scan, I want to run 10k in 45 minutes or less."
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            rows={3}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !dexaGoal.trim() || !functionalGoal.trim()}
          className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" />
          {loading ? 'Locking In...' : 'Lock In Goals'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          You'll receive 5,000 FitCoins once your goals are locked in
        </p>
      </form>
    </div>
  );
}

