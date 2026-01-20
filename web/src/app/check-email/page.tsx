'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <Mail className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-gray-400 mt-4 mb-6">
              We've sent you a verification email. Please check your inbox and click the verification link to activate your account.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Once you've verified your email, you can sign in and set up your goals.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
