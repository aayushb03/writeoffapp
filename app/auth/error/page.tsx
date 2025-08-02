"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'No token hash or type':
        return 'The confirmation link is invalid or has expired. Please try signing up again.';
      case 'Invalid email or password':
        return 'The email or password you entered is incorrect. Please try again.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link to verify your account.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Authentication Error
            </h1>
            <p className="text-slate-600 mb-6">
              {getErrorMessage(error)}
            </p>
            
            {error && (
              <div className="bg-red-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-700">
                  Error code: {error}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/sign-up')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Try Signing Up Again
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-slate-100 text-slate-700 py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                Sign In Instead
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-slate-50 text-slate-600 py-3 px-4 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
