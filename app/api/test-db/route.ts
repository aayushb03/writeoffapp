import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Test 2: Check if user_profiles table exists by trying to query it
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Test 3: If user exists, try to fetch their profile
    let profileTest = null;
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      profileTest = {
        hasProfile: !!profile,
        profileError: profileError?.message,
        profileErrorCode: profileError?.code
      };
    }

    return NextResponse.json({
      success: true,
      tests: {
        auth: {
          hasUser: !!user,
          userId: user?.id,
          authError: authError?.message
        },
        table: {
          exists: !error,
          error: error?.message,
          errorCode: error?.code,
          count
        },
        profile: profileTest
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
