'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpAction } from '@/app/actions';
import { Mail, Lock, User } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [loading, setLoading] = useState(false);

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

    // Validate name
    if (!name || name.trim().length === 0) {
      setError('Name is required');
      return;
    }

    setLoading(true);

    try {
      const result = await signUpAction(name.trim(), email, password);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Failed to sign up');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <span className="text-2xl font-bold text-gray-900">₿</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sign Up</h1>
            <p className="text-gray-400">Create your FitCoin account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

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
                placeholder="Password"
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
                placeholder="Confirm Password"
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
              disabled={loading || passwordMismatch || !name || !password || !confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-yellow-400 hover:text-yellow-500 font-semibold">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
