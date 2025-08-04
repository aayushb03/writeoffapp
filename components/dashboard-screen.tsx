/**
 * WriteOff Dashboard with AI-Powered Transaction Analysis
 * 
 * Features:
 * - Plaid integration for automatic bank transaction import
 * - OpenAI GPT-4 analysis for tax deductibility classification
 * - Real-time confidence scoring for AI decisions
 * - Manual transaction entry and editing
 * - Comprehensive expense tracking and categorization
 * 
 * AI Integration:
 * - Analyzes merchant name, amount, category, and date
 * - Provides deductibility determination with reasoning
 * - Confidence scores from 0-100% for each analysis
 * - Fallback to manual review for low-confidence results
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText,
  Settings,
  LogOut,
  PlusCircle,
  ArrowRight,
  Bell,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import TaxSavingsChart from './tax-savings-chart';
import { createLinkToken, exchangePublicToken, getAccountBalances, syncTransactions, analyzeTransactions } from '@/lib/api';
import { getTransactions } from '@/lib/database/transactions';
import { getUserProfile } from '@/lib/database/profiles';
import { DeductionIndicator } from '@/components/deduction-indicator';

interface DashboardScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onSignOut: () => void;
  onNavigate: (screen: string) => void;
  transactions?: Transaction[];
  onRefreshTransactions?: () => Promise<void>;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
  isDeductible: boolean;
  deductibleReason?: string;
  confidenceScore?: number; // AI confidence score (0-1)
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  user, 
  onSignOut, 
  onNavigate, 
  transactions: propTransactions, 
  onRefreshTransactions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [bankConnected, setBankConnected] = useState(false);
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [accountBalances, setAccountBalances] = useState<any[]>([]);
  const [analyzingTransactions, setAnalyzingTransactions] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Check if bank is connected on component mount
  useEffect(() => {
    const checkBankConnection = async () => {
      try {
        // Check if user has a Plaid token in their profile
        const { data: profile, error } = await getUserProfile(user.id);
        
        if (profile?.plaid_token) {
          setBankConnected(true);
        } else {
          setBankConnected(false);
        }
      } catch (error) {
        console.error('Error checking bank connection:', error);
        setBankConnected(false);
      }
    };

    checkBankConnection();
  }, [user.id]);

  // Use transactions passed from protected page
  useEffect(() => {
    if (propTransactions) {
      console.log('📋 Using transactions from protected page:', {
        count: propTransactions.length,
        sample: propTransactions[0],
        types: propTransactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, isDeductible: t.isDeductible }))
      });
      setRealTransactions(propTransactions);
    }
  }, [propTransactions]);
  
  // Create link token when needed
  const createLinkTokenHandler = async () => {
    console.log('Creating link token for user:', user.id);
    
    try {
      setPlaidLoading(true);
      setPlaidError(null);
      
      const { success, linkToken: token, error } = await createLinkToken(user.id);
      
      if (success && token) {
        console.log('Link token created successfully');
        setLinkToken(token);
      } else {
        console.error('Link token error:', error);
        throw new Error(typeof error === 'string' ? error : 'Failed to create link token');
      }
    } catch (err: unknown) {
      console.error('Error creating link token:', err);
      setPlaidError('Failed to initialize bank connection. Please try again.');
    } finally {
      setPlaidLoading(false);
    }
  };

  // Handle successful Plaid Link
  const onPlaidSuccess = useCallback(async (public_token: string) => {
    setPlaidLoading(true);
    setPlaidError(null);
    
    try {
      console.log('🔗 Exchanging public token for access token...');
      const { success, error } = await exchangePublicToken(public_token, user.id);

      if (!success) {
        console.error('API Error Response:', error);
        throw new Error(typeof error === 'string' ? error : 'Failed to exchange token');
      }

      setBankConnected(true);
      
      // Clear the link token so it can be regenerated if needed
      setLinkToken(null);
      
      // Show success message
      console.log('Bank connected successfully');
      
      // Fetch updated account balances
      const { success: balanceSuccess, accounts } = await getAccountBalances(user.id);
      if (balanceSuccess && accounts) {
        setAccountBalances(accounts);
      }
      
      // Fetch transactions after connection
      await syncTransactions(user.id); // Re-sync transactions after connection
      
    } catch (err: unknown) {
      console.error('Error connecting bank:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account. Please try again.';
      setPlaidError(errorMessage);
    } finally {
      setPlaidLoading(false);
    }
  }, [user.id]);

  // Handle transaction analysis
  const handleAnalyzeTransactions = async () => {
    setAnalyzingTransactions(true);
    setAnalysisResult(null);

    try {
      console.log('🤖 Starting transaction analysis...');
      const result = await analyzeTransactions(user.id);

      if (result.success) {
        console.log(`✅ Analysis completed! Analyzed ${result.analyzed} out of ${result.total} transactions`);
        setAnalysisResult(result);

        // Refresh transactions to show updated analysis
        if (onRefreshTransactions) {
          await onRefreshTransactions();
        }
      } else {
        console.error('❌ Analysis failed:', result.error);
        setAnalysisResult({ error: result.error });
      }
    } catch (error) {
      console.error('Error analyzing transactions:', error);
      setAnalysisResult({ error: 'Failed to analyze transactions' });
    } finally {
      setAnalyzingTransactions(false);
    }
  };

  // Plaid Link configuration
  const config = {
    token: linkToken || null,
    onSuccess: onPlaidSuccess,
    onExit: () => {
      setLinkToken(null);
      setPlaidLoading(false);
    },
    onEvent: (eventName: string, metadata: unknown) => {
      console.log('Plaid Link event:', eventName, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Handle connect bank button click
  const handleConnectBank = async () => {
    console.log('Connect bank button clicked!');
    console.log('Current linkToken:', linkToken);
    console.log('Plaid ready:', ready);
    
    try {
      setPlaidError(null);
      
      if (!linkToken) {
        console.log('No link token, creating one...');
        await createLinkTokenHandler();
      } else if (ready) {
        console.log('Opening Plaid Link...');
        open();
      } else {
        console.log('Plaid Link not ready yet');
      }
    } catch (error) {
      console.error('Error handling connect bank:', error);
      setPlaidError('Failed to initialize bank connection.');
    }
  };

  // Effect to open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && ready && !plaidLoading) {
      open();
    }
  }, [linkToken, ready, open, plaidLoading]);

  // Calculate real stats from transactions
  const calculateStats = () => {
    // Use real transactions if available, otherwise fall back to prop transactions
    const allTransactions = realTransactions.length ? realTransactions : (propTransactions || []);
    
    console.log('calculateStats called with:', {
      realTransactionsCount: realTransactions.length,
      propTransactionsCount: propTransactions?.length || 0,
      allTransactionsCount: allTransactions.length,
      sampleTransaction: allTransactions[0]
    });
    
    if (!allTransactions || allTransactions.length === 0) {
      console.log('No transactions found, returning zero stats');
      return {
        totalDeductions: 0,
        trackedExpenses: 0,
        totalRevenue: 0,
        netProfitLoss: 0,
        taxSavings: 0
      };
    }

    // Separate income and expense transactions based on the 'type' field
    const expenseTransactions = allTransactions.filter(t => t.type === 'expense');
    const incomeTransactions = allTransactions.filter(t => t.type === 'income');
    
    // Calculate deductible expenses (only from expense transactions)
    const deductibleTransactions = expenseTransactions.filter(t => t.isDeductible === true);
    const totalDeductible = deductibleTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Calculate total expenses (sum of all expense amounts)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Calculate total revenue (sum of all income amounts)
    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    // Calculate net profit/loss (revenue - expenses)
    const netProfitLoss = totalRevenue - totalExpenses;
    
    // Calculate tax savings (30% of deductible expenses)
    const estimatedTaxSavings = totalDeductible * 0.3;

    const stats = {
      totalDeductions: totalDeductible,
      trackedExpenses: totalExpenses,
      totalRevenue: totalRevenue,
      netProfitLoss: netProfitLoss,
      taxSavings: estimatedTaxSavings
    };
    
    console.log('Calculated stats:', {
      expenseTransactionsCount: expenseTransactions.length,
      incomeTransactionsCount: incomeTransactions.length,
      deductibleTransactionsCount: deductibleTransactions.length,
      totalDeductible,
      totalExpenses,
      totalRevenue,
      netProfitLoss,
      estimatedTaxSavings,
      stats
    });
    return stats;
  };

  const displayStats = useMemo(() => calculateStats(), [realTransactions, propTransactions]);

  // Use real transactions if available, otherwise fall back to prop transactions or empty array
  const displayTransactions = realTransactions.length ? 
    realTransactions.slice(0, 4).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : 
    (propTransactions?.slice(0, 4).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []);

  const [notifications] = useState([
    {
      id: '1',
      message: '🤖 AI-powered deduction analysis is now active',
      time: '1 hour ago',
      type: 'success'
    },
    {
      id: '2',
      message: 'New deductible expense detected: $149.99',
      time: '2 hours ago',
      type: 'success'
    },
    {
      id: '3',
      message: 'Monthly tax summary is ready to view',
      time: '1 day ago',
      type: 'info'
    }
  ]);

  // Show bank connection required screen if bank is not connected
  if (!bankConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-32 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">WriteOff</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    Welcome back, <span className="text-blue-600 font-bold">{user?.user_metadata?.name || user?.email}</span>
                  </h1>
                  <p className="text-sm text-slate-600">Connect your bank to get started</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => onNavigate('settings')}
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
                <Button 
                  onClick={onSignOut}
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 py-8">
          {/* Bank Connection Required */}
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Connect Your Bank Account
            </h2>
            
            <p className="text-base text-slate-600 mb-6">
              To start tracking your business expenses and maximizing tax deductions, 
              you'll need to connect your bank account. This allows us to automatically 
              import and analyze your transactions.
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-6 mx-auto mb-6" style={{ maxWidth: '500px' }}>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">Secure bank-level encryption</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">Automatic transaction import</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">AI-powered tax analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">Real-time deduction tracking</span>
                </div>
              </div>

              <Button 
                onClick={handleConnectBank}
                disabled={plaidLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                {plaidLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Connect Bank Account
                  </div>
                )}
              </Button>
            </div>

            {/* Alternative Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Button 
                onClick={() => onNavigate('add-expense')}
                variant="outline"
                className="h-10 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Expense Manually
              </Button>
              
              <Button 
                onClick={handleAnalyzeTransactions}
                disabled={analyzingTransactions}
                variant="outline"
                className="h-10 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl"
              >
                {analyzingTransactions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Transactions
                  </>
                )}
              </Button>
            </div>

            {/* Analysis Results Display */}
            {analysisResult && (
              <Card className={`p-6 shadow-lg ${
                analysisResult.error 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    analysisResult.error 
                      ? 'bg-red-100' 
                      : 'bg-green-100'
                  }`}>
                    {analysisResult.error ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        analysisResult.error 
                          ? 'text-red-800' 
                          : 'text-green-800'
                      }`}>
                        {analysisResult.error ? 'Analysis Failed' : 'Analysis Completed'}
                      </h3>
                      <Button 
                        onClick={() => setAnalysisResult(null)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <p className={`text-sm ${
                      analysisResult.error 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {analysisResult.error 
                        ? analysisResult.error 
                        : `Analyzed ${analysisResult.analyzed} out of ${analysisResult.total} transactions`
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Plaid Error Display */}
          {plaidError && (
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Card className="p-4 bg-red-50 border-red-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-800 font-medium text-sm">Connection Error</p>
                    <p className="text-red-600 text-xs">{plaidError}</p>
                  </div>
                  <Button 
                    onClick={() => setPlaidError(null)}
                    variant="outline"
                    size="sm"
                    className="ml-auto text-red-600 border-red-300 hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">WriteOff</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Welcome back, <span className="text-blue-600 font-bold">{user?.user_metadata?.name || user?.email}</span>
                </h1>
                <p className="text-sm text-slate-600">Ready to track your expenses and maximize deductions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button variant="outline" size="sm" className="gap-2">
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>
              <Button 
                onClick={() => onNavigate('settings')}
                variant="outline" 
                size="sm" 
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button 
                onClick={onSignOut}
                variant="outline" 
                size="sm" 
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onNavigate('deductions-detail')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Deductions</p>
                <p className="text-2xl font-bold text-slate-900">${displayStats.totalDeductions.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onNavigate('expenses-detail')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tracked Expenses</p>
                <p className="text-2xl font-bold text-slate-900">${displayStats.trackedExpenses.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onNavigate('profit-loss-detail')}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                displayStats.netProfitLoss >= 0 
                  ? 'bg-emerald-100' 
                  : 'bg-red-100'
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  displayStats.netProfitLoss >= 0 
                    ? 'text-emerald-600' 
                    : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Net P/L</p>
                <p className={`text-2xl font-bold ${
                  displayStats.netProfitLoss >= 0 
                    ? 'text-emerald-600' 
                    : 'text-red-600'
                }`}>
                  {displayStats.netProfitLoss >= 0 ? '+' : ''}${displayStats.netProfitLoss.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {displayStats.netProfitLoss >= 0 ? 'Profit' : 'Loss'} this period
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="text-xs text-slate-500">
                    Revenue: ${displayStats.totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onNavigate('summary')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tax Savings</p>
                <p className="text-2xl font-bold text-slate-900">${displayStats.taxSavings.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 py-8">
          {/* Left Column - Quick Actions & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tax Savings Chart */}
            <TaxSavingsChart transactions={realTransactions.length ? realTransactions : propTransactions} />

            {/* Quick Actions */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
                  <p className="text-slate-600">Get started with tracking your business expenses</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => onNavigate('add-expense')}
                  className="h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg justify-start gap-4 px-6"
                >
                  <PlusCircle className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Add Expense</p>
                    <p className="text-xs text-emerald-100">Manual entry</p>
                  </div>
                </Button>

                <Button 
                  onClick={handleConnectBank}
                  variant="outline"
                  disabled={plaidLoading}
                  className="h-16 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl justify-start gap-4 px-6 disabled:opacity-50"
                >
                  {plaidLoading ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : bankConnected ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Building2 className="w-6 h-6 text-blue-600" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">
                      {bankConnected ? 'Bank Connected' : plaidLoading ? 'Connecting...' : 'Connect Bank'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {bankConnected ? 'Auto tracking active' : 'Auto tracking'}
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={handleAnalyzeTransactions}
                  disabled={analyzingTransactions}
                  variant="outline"
                  className="h-16 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl justify-start gap-4 px-6 disabled:opacity-50"
                >
                  {analyzingTransactions ? (
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">
                      {analyzingTransactions ? 'Analyzing...' : 'Analyze Transactions'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {analyzingTransactions ? 'AI processing' : 'AI tax analysis'}
                    </p>
                  </div>
                </Button>

                <Button 
                  onClick={() => onNavigate('tax-calendar')}
                  variant="outline"
                  className="h-16 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl justify-start gap-4 px-6"
                >
                  <Calendar className="w-6 h-6 text-orange-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Tax Calendar</p>
                    <p className="text-xs text-slate-600">Important dates</p>
                  </div>
                </Button>
              </div>
            </Card>

            {/* AI Test Results Display */}
            {/* Removed aiTestResult state and display */}

            {/* Analysis Results Display */}
            {analysisResult && (
              <Card className={`p-6 shadow-lg ${
                analysisResult.error 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    analysisResult.error 
                      ? 'bg-red-100' 
                      : 'bg-green-100'
                  }`}>
                    {analysisResult.error ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        analysisResult.error 
                          ? 'text-red-800' 
                          : 'text-green-800'
                      }`}>
                        {analysisResult.error ? 'Analysis Failed' : 'Analysis Completed'}
                      </h3>
                      <Button 
                        onClick={() => setAnalysisResult(null)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <p className={`text-sm ${
                      analysisResult.error 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {analysisResult.error 
                        ? analysisResult.error 
                        : `Analyzed ${analysisResult.analyzed} out of ${analysisResult.total} transactions`
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Plaid Error Display */}
            {plaidError && (
              <Card className="p-6 bg-red-50 border-red-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">!</span>
                  </div>
                  <div>
                    <p className="text-red-800 font-medium">Connection Error</p>
                    <p className="text-red-600 text-sm">{plaidError}</p>
                  </div>
                  <Button 
                    onClick={() => setPlaidError(null)}
                    variant="outline"
                    size="sm"
                    className="ml-auto text-red-600 border-red-300 hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Recent Transactions</h3>
                  <p className="text-slate-600">Your latest business expenses</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {displayTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-600 mb-2">No transactions found</p>
                    <p className="text-xs text-slate-500">Connect your bank account to see transactions</p>
                  </div>
                ) : (
                  displayTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => onNavigate('transactions')}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-emerald-100' 
                          : 'bg-blue-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {transaction.merchant_name || transaction.description || 'Unknown Transaction'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span>{transaction.category}</span>
                          <span>•</span>
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={`font-medium ${
                            transaction.type === 'income' 
                              ? 'text-emerald-600' 
                              : 'text-slate-600'
                          }`}>
                            {transaction.type === 'income' ? 'Revenue' : 'Expense'}
                          </span>
                        </div>
                        {/* Show deduction indicator only for expenses */}
                        {transaction.type === 'expense' && (
                          <div className="mt-2">
                            <DeductionIndicator
                              isDeductible={transaction.isDeductible}
                              confidenceScore={transaction.confidenceScore}
                              deductibleReason={transaction.deductibleReason}
                              compact={true}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'income' 
                            ? 'text-emerald-600' 
                            : 'text-slate-900'
                        }`}>
                          ${Math.abs(transaction.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )))}
              </div>

              <div className="mt-6 text-center">
                <Button 
                  onClick={() => onNavigate('transactions')}
                  variant="outline" 
                  className="gap-2"
                >
                  View All Transactions
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile & Notifications */}
          <div className="space-y-6 px-6">
            {/* Profile Info */}
            <Card className="p-6 bg-white border-0 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{user?.user_metadata?.name || 'User'}</h3>
                <p className="text-sm text-slate-600">Professional</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Monthly Expenses</span>
                  <span className="text-sm font-medium text-slate-900">$2,135</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">This Month's Savings</span>
                  <span className="text-sm font-medium text-emerald-600">$640</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Bank Connected</span>
                  <span className="text-sm font-medium text-emerald-600">Yes</span>
                </div>
              </div>

              <Button 
                onClick={() => onNavigate('settings')}
                variant="outline" 
                className="w-full mt-4"
              >
                Edit Profile
              </Button>
            </Card>

            {/* Notifications */}
            <Card className="p-6 bg-white border-0 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Notifications</h3>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-900">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View All Notifications
              </Button>
            </Card>

            {/* Tax Tips */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">💡 Tax Tip</h3>
                <p className="text-sm text-blue-100">
                  Track your home office expenses! If you work from home, you may be able to deduct a portion of your rent, utilities, and office supplies.
                </p>
              </div>
              <Button size="sm" variant="secondary" className="w-full">
                Learn More
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
