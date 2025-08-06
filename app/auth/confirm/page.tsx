"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/protected';

  useEffect(() => {
    // Since the backend verification is working, just redirect to the protected area
    // The user can log in normally if they're not authenticated
    const timer = setTimeout(() => {
      router.push(next);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, next]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Email Confirmed!
            </h1>
            <p className="text-slate-600 mb-6">
              Your email has been successfully verified. Redirecting you to log in...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 