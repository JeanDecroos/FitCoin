'use client';

import { useState } from 'react';
import { requestFundsAction } from '@/app/actions';
import { X } from 'lucide-react';

interface BuyCoinsModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuyCoinsModal({
  userId,
  onClose,
  onSuccess,
}: BuyCoinsModalProps) {
  const [euroAmount, setEuroAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const fitcoinAmount = euroAmount ? Math.floor(parseFloat(euroAmount) * 10) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!euroAmount) {
      alert('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(euroAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await requestFundsAction(userId, amountNum);
      alert('Fund request submitted! Waiting for admin approval.');
      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to submit fund request');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Buy FitCoins</h2>
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
              Amount in Euros (€)
            </label>
            <input
              type="number"
              value={euroAmount}
              onChange={(e) => setEuroAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="10.00"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Exchange rate: 10 FitCoins = 1 €
            </p>
          </div>

          {euroAmount && fitcoinAmount > 0 && (
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">You will receive:</span>
                <span className="text-xl font-bold text-yellow-400">
                  {fitcoinAmount.toLocaleString()} FitCoins
                </span>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              ⓘ Your request will be reviewed by the admin. You'll receive the FitCoins once approved.
            </p>
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
              disabled={loading || !euroAmount || fitcoinAmount <= 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
