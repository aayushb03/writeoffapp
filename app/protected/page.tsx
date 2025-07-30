"use client";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileSetupScreen } from "@/components/profile-setup-screen";
import { DashboardScreen } from "@/components/dashboard-screen";
import { SettingsScreen } from "@/components/settings-screen";
import { DebugProfile } from "@/components/debug-profile";
import { AddExpenseScreen } from "@/components/add-expense-screen";
import { ReceiptUploadScreen } from "@/components/receipt-upload-screen";
import { TaxCalendarScreen } from "@/components/tax-calendar-screen";
import { TransactionsListScreen } from "@/components/transactions-list-screen";
import { DeductionsDetailScreen } from "@/components/deductions-detail-screen";
import { ExpensesDetailScreen } from "@/components/expenses-detail-screen";
import { BanksDetailScreen } from "@/components/banks-detail-screen";
import { getUserProfile } from "@/lib/database/profiles";
import { testDatabaseConnection } from "@/lib/database/test";
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
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
  isDeductible: boolean;
  notes?: string;
}

export default function ProtectedPage() {
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'settings' | 'debug' | 'add-expense' | 'receipt-upload' | 'tax-calendar' | 'transactions' | 'edit-expense' | 'deductions-detail' | 'expenses-detail' | 'banks-detail'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      description: 'Office Supplies - Staples',
      amount: 149.99,
      category: 'Office Supplies',
      date: '2024-12-28',
      type: 'expense',
      isDeductible: true
    },
    {
      id: '2',
      description: 'Adobe Creative Suite',
      amount: 52.99,
      category: 'Software & Subscriptions',
      date: '2024-12-27',
      type: 'expense',
      isDeductible: true
    },
    {
      id: '3',
      description: 'Client Meeting Lunch',
      amount: 85.50,
      category: 'Meals & Entertainment',
      date: '2024-12-26',
      type: 'expense',
      isDeductible: true
    },
    {
      id: '4',
      description: 'Uber to Client Office',
      amount: 24.75,
      category: 'Travel & Transportation',
      date: '2024-12-25',
      type: 'expense',
      isDeductible: true
    },
    {
      id: '5',
      description: 'MacBook Pro 16"',
      amount: 2399.99,
      category: 'Equipment & Hardware',
      date: '2024-12-20',
      type: 'expense',
      isDeductible: true
    },
    {
      id: '6',
      description: 'Website Domain Renewal',
      amount: 12.99,
      category: 'Professional Services',
      date: '2024-12-18',
      type: 'expense',
      isDeductible: true
    },
    {
      id: '7',
      description: 'Client Payment - Web Design',
      amount: 1500.00,
      category: 'Professional Services',
      date: '2024-12-15',
      type: 'income',
      isDeductible: false
    }
  ]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

  const handleProfileComplete = (profile: UserProfile) => {
    console.log('Profile setup completed:', profile);
    setHasProfile(true);
    // Optionally redirect to dashboard or next step
  };

  const handleBack = () => {
    // Handle logout or back to login
    supabase.auth.signOut();
    router.push("/");
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
    } else if (screen === 'deductions-detail') {
      setCurrentScreen('deductions-detail');
    } else if (screen === 'expenses-detail') {
      setCurrentScreen('expenses-detail');
    } else if (screen === 'banks-detail') {
      setCurrentScreen('banks-detail');
    }
    // You can add more screen navigation logic here
  };

  // Handle sign out
  const handleSignOut = () => {
    router.push("/");
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

  // Handle receipt upload completion
  const handleReceiptUploadComplete = (expenseData: any) => {
    const transaction: Transaction = {
      id: expenseData.id,
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      date: expenseData.date,
      type: 'expense',
      isDeductible: expenseData.isDeductible,
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
          onEditTransaction={handleEditTransaction}
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
    
    return (
      <DashboardScreen 
        user={user} 
        onSignOut={handleSignOut}
        onNavigate={handleNavigate}
        transactions={transactions}
      />
    );
  }

  return null;
}
