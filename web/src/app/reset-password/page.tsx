'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { resetPasswordAction } from '@/app/actions';
import { Lock, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase Auth uses hash fragments (#access_token=...) for password reset
  // We need to handle this in the client component
  useEffect(() => {
    // Check if we have the hash fragment with Supabase tokens
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) {
        setError('Invalid reset link. Please request a new password reset.');
      }
    }
  }, []);

  function validatePasswords() {
    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordMismatch(true);
      return false;
    }
    setPasswordMismatch(false);
    return true;
  }

  function handleConfirmPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(e.target.value);
    if (e.target.value && password && e.target.value !== password) {
      setPasswordMismatch(true);
    } else {
      setPasswordMismatch(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPasswordMismatch(false);

    // Supabase Auth handles token validation automatically via session
    // The hash fragment contains the session token

    // Validate passwords match
    if (!validatePasswords()) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPasswordAction(password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Password Reset!</h1>
            <p className="text-gray-400 mb-6">
              Your password has been successfully reset. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <Lock className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-400">Enter your new password</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (confirmPassword && e.target.value !== confirmPassword) {
                    setPasswordMismatch(true);
                  } else if (confirmPassword && e.target.value === confirmPassword) {
                    setPasswordMismatch(false);
                  }
                }}
                placeholder="New Password"
                required
                minLength={6}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  passwordMismatch
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-yellow-500 focus:border-transparent'
                }`}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm New Password"
                required
                minLength={6}
                className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  passwordMismatch
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-yellow-500 focus:border-transparent'
                }`}
              />
            </div>

            {passwordMismatch && (
              <div className="text-red-400 text-sm">
                Passwords do not match
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordMismatch || !password || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-yellow-400 hover:text-yellow-500 text-sm font-semibold"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <Lock className="w-8 h-8 text-gray-900 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
