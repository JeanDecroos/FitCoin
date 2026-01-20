'use client';

/**
 * Email Verification Confirmation Page
 * 
 * This page handles email verification after users sign up. When a user clicks the
 * verification link in their email, Supabase redirects them here with authentication
 * tokens in the URL (either as hash fragments or query parameters).
 * 
 * Flow:
 * 1. User clicks verification link in email → Supabase verifies token
 * 2. Supabase redirects to this page with session tokens
 * 3. This page extracts tokens and creates a session
 * 4. User is redirected to the goals page to set up their challenge
 * 
 * The redirect URL is configured in:
 * - Supabase Dashboard: Authentication → URL Configuration → Redirect URLs
 * - Code: web/src/app/actions.ts (signUpAction emailRedirectTo)
 * 
 * See SUPABASE_SETUP.md for configuration details.
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    async function handleEmailVerification() {
      try {
        // Get the hash fragment from the URL (Supabase redirects here with tokens after verification)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Also check query params (for direct token verification)
        const queryToken = searchParams.get('token');
        const queryType = searchParams.get('type');
        const queryError = searchParams.get('error');
        const queryTokenHash = searchParams.get('token_hash');
        const queryEmail = searchParams.get('email');

        // Handle error cases
        if (error || queryError) {
          setStatus('error');
          setMessage(errorDescription || queryError || 'Verification failed. Please try again.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // If we have tokens in the hash (Supabase redirects here after verification)
        // This is the most common flow - user clicks email link, Supabase verifies, then redirects here
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting to goals...');
          
          // Wait a moment to show success message, then redirect to goals page
          setTimeout(() => {
            router.push('/goals');
            router.refresh();
          }, 2000);
          return;
        }

        // Handle token-based verification (if using query params)
        // This handles cases where the token is passed directly in query params
        if ((queryToken || queryTokenHash) && queryType) {
          let verifyError = null;
          
          // Try with token_hash first (most common, doesn't require email)
          if (queryTokenHash) {
            const result = await supabase.auth.verifyOtp({
              token_hash: queryTokenHash,
              type: queryType as any,
            });
            verifyError = result.error;
          } 
          // If no token_hash, try with token (for PKCE tokens like pkce_...)
          else if (queryToken) {
            // For PKCE tokens, we need to use the token directly
            // Check if it's a PKCE token
            if (queryToken.startsWith('pkce_')) {
              // PKCE tokens need to be verified differently
              // They're typically handled by Supabase's redirect flow
              // But we can try verifyOtp with token_hash
              const result = await supabase.auth.verifyOtp({
                token_hash: queryToken,
                type: queryType as any,
              });
              verifyError = result.error;
            } else {
              // Regular token - for email OTP, we need email parameter
              // If email is not available, use token_hash approach instead
              if (queryEmail) {
                const result = await supabase.auth.verifyOtp({
                  token: queryToken,
                  type: queryType as any,
                  email: queryEmail,
                });
                verifyError = result.error;
              } else {
                // Fallback: try using token as token_hash if email not available
                const result = await supabase.auth.verifyOtp({
                  token_hash: queryToken,
                  type: queryType as any,
                });
                verifyError = result.error;
              }
            }
          }

          if (verifyError) {
            throw verifyError;
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting to goals...');
          
          setTimeout(() => {
            router.push('/goals');
            router.refresh();
          }, 2000);
          return;
        }

        // If no tokens found, check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setMessage('Email already verified! Redirecting to goals...');
          setTimeout(() => {
            router.push('/goals');
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

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Loading...</h1>
              <p className="text-gray-400 mt-4">Verifying your email...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}
