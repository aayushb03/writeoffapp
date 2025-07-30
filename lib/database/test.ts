import { createClient } from '@/lib/supabase/client';

export async function testDatabaseConnection() {
  const supabase = createClient();
  
  try {
    // Test 1: Check if we can connect to Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', { user: user?.id, error: authError });

    // Test 2: Check if user_profiles table exists and we can query it
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('Table test:', { 
      tableExists: !error,
      error: error?.message,
      errorCode: error?.code,
      count 
    });

    // Test 3: If user exists, try to get their profile
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      console.log('Profile test:', { 
        hasProfile: !!profile,
        profile,
        error: profileError?.message,
        errorCode: profileError?.code 
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { success: false, error };
  }
}
