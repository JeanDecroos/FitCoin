'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    async function handleEmailVerification() {
      try {
        // Get the hash fragment from the URL (Supabase uses hash fragments for auth callbacks)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Also check query params (some configurations use query params)
        const queryToken = searchParams.get('token');
        const queryType = searchParams.get('type');
        const queryError = searchParams.get('error');

        // Handle error cases
        if (error || queryError) {
          setStatus('error');
          setMessage(errorDescription || queryError || 'Verification failed. Please try again.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // If we have tokens in the hash, exchange them for a session
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 2000);
          return;
        }

        // Handle token-based verification (if using query params)
        if (queryToken && queryType === 'signup') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: queryToken,
            type: 'signup',
          });

          if (verifyError) {
            throw verifyError;
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 2000);
          return;
        }

        // If no tokens found, check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setMessage('Email already verified! Redirecting...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 2000);
          return;
        }

        // No tokens and no session - might be a direct visit
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage(err.message || 'Verification failed. Please try again.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    }

    handleEmailVerification();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              {status === 'loading' && (
                <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-8 h-8 text-gray-900" />
              )}
              {status === 'error' && (
                <span className="text-2xl font-bold text-gray-900">₿</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {status === 'loading' && 'Verifying Email'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </h1>
            <p className="text-gray-400 mt-4">{message}</p>
            {status === 'error' && (
              <button
                onClick={() => router.push('/login')}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
