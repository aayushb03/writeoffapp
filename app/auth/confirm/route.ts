import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/protected';

    console.log('Server-side email confirmation params:', { code, next });

    if (!code) {
      console.error('No code provided in email confirmation');
      redirect('/auth/error?error=No confirmation code provided');
    }

    const supabase = await createClient();

    // Try to verify the OTP on the server side
    const { data, error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token_hash: code,
    });

    if (error) {
      console.error('Server-side OTP verification error:', error);
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      console.log('Server-side session created successfully');
      redirect(next);
    } else {
      console.error('No session created on server side');
      redirect('/auth/error?error=No session created');
    }
  } catch (error) {
    console.error('Server-side email confirmation error:', error);
    redirect('/auth/error?error=Unexpected error during confirmation');
  }
} 