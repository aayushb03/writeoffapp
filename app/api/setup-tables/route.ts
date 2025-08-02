import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST() {
  try {
    const supabase = await createClient();

    // Read the SQL script from the file
    const sqlFilePath = join(process.cwd(), 'sql', 'setup_database.sql');
    const sqlScript = readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlScript
    });

    // Test the tables
    const { data: testProfiles, error: testProfilesError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const { data: testAccounts, error: testAccountsError } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    const { data: testTransactions, error: testTransactionsError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Database tables setup completed using SQL script',
      rpcResult: { data, error: error?.message },
      userProfilesTest: {
        works: !testProfilesError,
        error: testProfilesError?.message,
        errorCode: testProfilesError?.code
      },
      accountsTest: {
        works: !testAccountsError,
        error: testAccountsError?.message,
        errorCode: testAccountsError?.code
      },
      transactionsTest: {
        works: !testTransactionsError,
        error: testTransactionsError?.message,
        errorCode: testTransactionsError?.code
      }
    });

  } catch (error: any) {
    console.error('Error creating tables:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 });
  }
} 