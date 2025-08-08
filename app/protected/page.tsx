"use client";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileSetupScreen } from "@/components/profile-setup-screen";
import DashboardScreen from "@/components/dashboard-screen";
import { SettingsScreen } from "@/components/settings-screen";
import { DebugProfile } from "@/components/debug-profile";
import { AddExpenseScreen } from "@/components/add-expense-screen";
import { ReceiptUploadScreen } from "@/components/receipt-upload-screen";
import { TaxCalendarScreen } from "@/components/tax-calendar-screen";
import { TransactionsListScreen } from "@/components/transactions-list-screen";
import { ReviewTransactionsScreen } from "@/components/review-transactions-screen";
import { ScheduleCExportScreen } from "@/components/schedule-c-export-screen";
import { DeductionsDetailScreen } from "@/components/deductions-detail-screen";
import { ExpensesDetailScreen } from "@/components/expenses-detail-screen";
import { BanksDetailScreen } from "@/components/banks-detail-screen";
import { ProfitLossDetailScreen } from "@/components/profit-loss-detail-screen";
import { CategoriesScreen } from "@/components/categories-screen";
import { PlaidLinkScreen } from "@/components/plaid-link-screen";
import { PlaidScreen } from "@/components/plaid-screen";
import { TransactionDetailScreen } from "@/components/transaction-detail-screen";
import { getUserProfile } from "@/lib/database/profiles";
import { testDatabaseConnection } from "@/lib/database/test";
import { syncTransactions } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  email: string;
  name: string;
  profession: string;
  income: string;
  state: string;
  filingStatus: string;
  plaidToken?: string;
}

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  category: string;
  date: string;
  type?: 'expense' | 'income';
  is_deductible?: boolean | null;
  deductible_reason?: string;
  deduction_score?: number;
  description?: string;
  notes?: string;
}

export default function ProtectedPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'settings' | 'debug' | 'add-expense' | 'receipt-upload' | 'tax-calendar' | 'transactions' | 'review-transactions' | 'schedule-c-export' | 'edit-expense' | 'deductions-detail' | 'expenses-detail' | 'banks-detail' | 'profit-loss-detail' | 'categories' | 'plaid-link' | 'plaid' | 'transaction-detail'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [analyzingTransactions, setAnalyzingTransactions] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch transactions from database
  const fetchTransactions = async () => {
    if (!user?.id) return;
    
    setLoadingTransactions(true);
    try {
      // Fetch all transactions from database via server-side API
      console.log('📊 Fetching transactions from database via API...');
      const response = await fetch(`/api/transactions?userId=${user.id}`);
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch transactions:', result.error);
      } else {
        console.log('📋 Raw transactions from API:', result.transactions);
        console.log('📊 Transaction count:', result.count);
        if (result.transactions && result.transactions.length > 0) {
          console.log('📋 Sample transaction:', result.transactions[0]);
        }
        setTransactions(result.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Check bank connection and fetch transactions
  const checkBankConnectionAndFetchTransactions = async (currentUser: any) => {
    try {
      // Check if user has a Plaid token in their profile
      const { data: profile, error } = await getUserProfile(currentUser.id);
      
      if (profile?.plaid_token) {
        setBankConnected(true);
        // Sync transactions from Plaid first, then fetch from database
        console.log('🔄 Syncing transactions from Plaid...');
        const syncResult = await syncTransactions(currentUser.id);
        
        if (syncResult.success) {
          console.log(`✅ Synced ${syncResult.transactionsSaved} new transactions from Plaid`);
        } else {
          console.error('❌ Failed to sync transactions:', syncResult.error);
        }
        
        // Then fetch all transactions from database
        await fetchTransactions();
      } else {
        setBankConnected(false);
        // Still fetch any existing transactions
        await fetchTransactions();
      }
    } catch (error) {
      console.error('Error checking bank connection:', error);
      setBankConnected(false);
      // Still fetch any existing transactions
      await fetchTransactions();
    }
  };

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          router.push("/auth/login");
          return;
        }

        setUser(currentUser);

        // Check if user has completed profile setup
        const { data: profile, error: profileError } = await getUserProfile(currentUser.id);
        
        if (profileError) {
          // PGRST116 means no rows returned (user has no profile yet)
          if (profileError.code === 'PGRST116') {
            console.log('No profile found for user, showing setup screen');
            setHasProfile(false);
          } else {
            console.error('Error checking profile:', {
              message: profileError.message,
              code: profileError.code,
              details: profileError.details,
              hint: profileError.hint
            });
            
            // Run database connection test to help debug
            console.log('Running database connection test...');
            await testDatabaseConnection();
            
            setHasProfile(false); // Default to showing profile setup on error
          }
        } else {
          setHasProfile(!!profile);
          setUserProfile(profile);
          // If user has profile, check bank connection and fetch transactions
          if (profile) {
            await checkBankConnectionAndFetchTransactions(currentUser);
          }
        }
      } catch (error) {
        console.error('Error in checkUserAndProfile:', error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndProfile();
  }, [router, supabase]);

  // Refresh transactions when navigating to dashboard
  useEffect(() => {
    if (currentScreen === 'dashboard' && user?.id && hasProfile === true) {
      fetchTransactions();
    }
  }, [currentScreen, user?.id, hasProfile]);

  const handleProfileComplete = async (profile: UserProfile) => {
    console.log('Profile setup completed:', profile);
    setHasProfile(true);
    
    // Fetch the complete profile from database to ensure we have all fields
    if (user) {
      try {
        const { data: userProfile, error: profileError } = await getUserProfile(user.id);
        
        if (profileError) {
          console.error('Error fetching user profile after completion:', profileError);
        } else {
          console.log('✅ User profile loaded after completion:', userProfile);
          setUserProfile(userProfile);
        }
        
        // Check bank connection and fetch transactions after profile completion
        await checkBankConnectionAndFetchTransactions(user);
      } catch (error) {
        console.error('Error in handleProfileComplete:', error);
      }
    }
  };

  const handleBack = async () => {
    // Handle logout or back to login
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error('Error signing out:', error);
      router.push("/");
    }
  };

  // Handle navigation between screens
  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    if (screen === 'settings') {
      setCurrentScreen('settings');
    } else if (screen === 'dashboard') {
      setCurrentScreen('dashboard');
    } else if (screen === 'debug') {
      setCurrentScreen('debug');
    } else if (screen === 'categorize' || screen === 'add-expense') {
      setEditingTransaction(null);
      setCurrentScreen('add-expense');
    } else if (screen === 'receipt-upload') {
      setCurrentScreen('receipt-upload');
    } else if (screen === 'tax-calendar') {
      setCurrentScreen('tax-calendar');
    } else if (screen === 'transactions') {
      setCurrentScreen('transactions');
    } else if (screen === 'review-transactions') {
      setCurrentScreen('review-transactions');
    } else if (screen === 'schedule-c-export') {
      setCurrentScreen('schedule-c-export');
    } else if (screen === 'deductions-detail') {
      setCurrentScreen('deductions-detail');
    } else if (screen === 'expenses-detail') {
      setCurrentScreen('expenses-detail');
    } else if (screen === 'banks-detail') {
      setCurrentScreen('banks-detail');
    } else if (screen === 'profit-loss-detail') {
      setCurrentScreen('profit-loss-detail');
    } else if (screen === 'categories') {
      setCurrentScreen('categories');
    } else if (screen === 'plaid-link') {
      setCurrentScreen('plaid-link');
    } else if (screen === 'plaid') {
      setCurrentScreen('plaid');
    } else if (screen === 'transaction-detail') {
      setCurrentScreen('transaction-detail');
    }
    // You can add more screen navigation logic here
  };

  // Handle viewing transaction details
  const handleViewTransaction = (transaction: Transaction) => {
    setViewingTransaction(transaction);
    setCurrentScreen('transaction-detail');
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error('Error signing out:', error);
      router.push("/");
    }
  };

  // Handle saving transactions
  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => {
      const existingIndex = prev.findIndex(t => t.id === transaction.id);
      if (existingIndex >= 0) {
        // Update existing transaction
        const updated = [...prev];
        updated[existingIndex] = transaction;
        return updated;
      } else {
        // Add new transaction
        return [...prev, transaction];
      }
    });
  };

  // Handle editing a transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setCurrentScreen('add-expense');
  };

  // Handle transaction update (for review screen)
  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      )
    );
    setViewingTransaction(prev => prev && prev.id === updatedTransaction.id ? { ...prev, ...updatedTransaction } : prev);
  };

  // Handle receipt upload completion
  const handleReceiptUploadComplete = (expenseData: any) => {
    const transaction: Transaction = {
      id: expenseData.id,
      merchant_name: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      date: expenseData.date,
      type: 'expense',
      is_deductible: expenseData.isDeductible,
      notes: `Receipt uploaded: ${expenseData.receipt?.fileName || 'receipt.jpg'}`
    };
    handleSaveTransaction(transaction);
  };  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show profile setup screen if user hasn't completed their profile
  if (user && hasProfile === false) {
    return (
      <ProfileSetupScreen
        user={user}
        onBack={handleBack}
        onComplete={handleProfileComplete}
      />
    );
  }

  // Show dashboard if user has completed profile setup
  if (user && hasProfile === true) {
    if (currentScreen === 'debug') {
      return (
        <div>
          <div className="p-4">
            <button 
              onClick={() => setCurrentScreen('dashboard')} 
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Back to Dashboard
            </button>
          </div>
          <DebugProfile user={user} />
        </div>
      );
    }
    
    if (currentScreen === 'settings') {
      return (
        <SettingsScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentScreen === 'add-expense') {
      return (
        <AddExpenseScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          onSave={handleSaveTransaction}
          editingExpense={editingTransaction}
        />
      );
    }

    if (currentScreen === 'receipt-upload') {
      return (
        <ReceiptUploadScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          onUploadComplete={handleReceiptUploadComplete}
        />
      );
    }

    if (currentScreen === 'tax-calendar') {
      return (
        <TaxCalendarScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
        />
      );
    }

    if (currentScreen === 'transactions') {
      return (
        <TransactionsListScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          onEditTransaction={handleViewTransaction} // changed from handleEditTransaction to open detail screen
          transactions={transactions}
        />
      );
    }

    if (currentScreen === 'review-transactions') {
      return (
        <ReviewTransactionsScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          transactions={transactions}
          onTransactionUpdate={handleTransactionUpdate}
          onTransactionClick={handleViewTransaction}
        />
      );
    }

    if (currentScreen === 'schedule-c-export') {
      return (
        <ScheduleCExportScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          transactions={transactions}
        />
      );
    }

    if (currentScreen === 'deductions-detail') {
      return (
        <DeductionsDetailScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          transactions={transactions}
        />
      );
    }

    if (currentScreen === 'expenses-detail') {
      return (
        <ExpensesDetailScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          transactions={transactions}
          onTransactionClick={(t) => handleViewTransaction(t)}
        />
      );
    }

    if (currentScreen === 'banks-detail') {
      return (
        <BanksDetailScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          onConnectBank={() => {
            // You can implement Plaid connection here or navigate to a connect screen
            setCurrentScreen('dashboard');
          }}
        />
      );
    }

    if (currentScreen === 'profit-loss-detail') {
      return (
        <ProfitLossDetailScreen
          onNavigate={handleNavigate}
          transactions={transactions}
        />
      );
    }

    if (currentScreen === 'categories') {
      return (
        <CategoriesScreen
          user={user}
          onBack={() => setCurrentScreen('dashboard')}
          transactions={transactions}
          onTransactionClick={(transaction) => handleViewTransaction(transaction)}
        />
      );
    }

    if (currentScreen === 'plaid-link') {
      return (
        <PlaidLinkScreen
          user={user}
          onSuccess={() => setCurrentScreen('dashboard')}
          onBack={() => setCurrentScreen('settings')}
        />
      );
    }

    if (currentScreen === 'plaid') {
      return (
        <PlaidScreen
          user={user}
          onBack={() => setCurrentScreen('settings')}
          onConnect={() => setCurrentScreen('plaid-link')}
        />
      );
    }

    if (currentScreen === 'transaction-detail' && viewingTransaction) {
      return (
        <TransactionDetailScreen
          transaction={viewingTransaction}
          onBack={() => setCurrentScreen('dashboard')}
          onSave={handleSaveTransaction}
        />
      );
    }
    
    return (
      <DashboardScreen 
        profile={userProfile}
        transactions={transactions}
        onNavigate={handleNavigate}
        onTransactionClick={(transaction) => handleViewTransaction(transaction)}
        onAnalyzeTransactions={async () => {
          setAnalyzingTransactions(true);
          try {
            await fetchTransactions();
          } finally {
            setAnalyzingTransactions(false);
          }
        }}
        analyzingTransactions={analyzingTransactions}
        onSignOut={handleSignOut}
      />
    );
  }

  return null;
}
