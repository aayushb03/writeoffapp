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
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import TaxSavingsChart from './tax-savings-chart';

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
  transactions: propTransactions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [bankConnected, setBankConnected] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch real transactions from database
  const fetchRealTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(`/api/transactions?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched real transactions:', data.transactions);
        setRealTransactions(data.transactions);
      } else {
        console.error('Failed to fetch transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch transactions on component mount
  useEffect(() => {
    fetchRealTransactions();
  }, [user.id]);
  
  // Create link token when needed
  const createLinkToken = async () => {
    console.log('Creating link token for user:', user.id);
    
    try {
      setPlaidLoading(true);
      setPlaidError(null);
      
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      console.log('Link token response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Link token error response:', errorText);
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      console.log('Link token created successfully:', data.link_token ? 'Yes' : 'No');
      setLinkToken(data.link_token);
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
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          public_token,
          userId: user.id 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      setBankConnected(true);
      
      // Clear the link token so it can be regenerated if needed
      setLinkToken(null);
      
      // Show success message (you could add a toast here)
      console.log('Bank connected successfully:', data);
      
      // Test fetching and analyzing transactions automatically
      console.log('🤖 Starting automatic transaction analysis...');
      try {
        const transactionResponse = await fetch('/api/plaid/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });

        if (transactionResponse.ok) {
          const transactionData = await transactionResponse.json();
          console.log(`✅ Analyzed ${transactionData.count} transactions with AI`);
          
          // Fetch the updated transactions from database
          await fetchRealTransactions();
        }
      } catch (error) {
        console.error('Error fetching/analyzing transactions:', error);
      }
      
    } catch (err: unknown) {
      console.error('Error connecting bank:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account. Please try again.';
      setPlaidError(errorMessage);
    } finally {
      setPlaidLoading(false);
    }
  }, [user.id]);

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
        await createLinkToken();
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

  // Test OpenAI analysis
  const testAIAnalysis = async () => {
    console.log('Testing OpenAI analysis...');
    setTestingAI(true);
    setAiTestResult(null);
    
    const testTransaction = {
      merchant_name: 'Amazon Web Services',
      amount: 87.50,
      category: 'Services, Cloud Computing',
      date: '2024-12-28'
    };

    try {
      const response = await fetch('/api/openai/analyze-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction: testTransaction }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAiTestResult({
          success: true,
          transaction: testTransaction,
          analysis: data.analysis
        });
        console.log('✅ AI Analysis successful:', data.analysis);
      } else {
        setAiTestResult({
          success: false,
          error: data.error
        });
        console.error('❌ AI Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Error testing AI analysis:', error);
      setAiTestResult({
        success: false,
        error: 'Network error or server unavailable'
      });
    } finally {
      setTestingAI(false);
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
      allTransactionsCount: allTransactions.length
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

    // Calculate based on real transaction data from Plaid
    const deductibleTransactions = allTransactions.filter(t => t.is_deductible === true);
    const totalDeductible = deductibleTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // All transactions are expenses in our system (Plaid amounts are positive for debits)
    const totalExpenses = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // For revenue, we'd need to categorize or identify income transactions
    // For now, we'll separate based on categories or merchant names that indicate income
    const incomeCategories = ['deposit', 'transfer', 'payroll', 'income'];
    const incomeTransactions = allTransactions.filter(t => {
      const category = (t.category || '').toLowerCase();
      const merchant = (t.merchant_name || '').toLowerCase();
      return incomeCategories.some(cat => category.includes(cat) || merchant.includes(cat));
    });
    
    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
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
    
    console.log('Calculated stats:', stats);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
                onClick={testAIAnalysis}
                disabled={testingAI}
                variant="outline" 
                size="sm" 
                className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {testingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {testingAI ? 'Testing...' : 'Test AI'}
              </Button>
              <Button 
                onClick={() => onNavigate('debug')}
                variant="outline" 
                size="sm" 
                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <FileText className="w-4 h-4" />
                Debug
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

      <div className="max-w-7xl mx-auto p-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">          
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
                  onClick={() => onNavigate('receipt-upload')}
                  variant="outline"
                  className="h-16 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl justify-start gap-4 px-6"
                >
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Upload Receipt</p>
                    <p className="text-xs text-slate-600">Scan & categorize</p>
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
            {aiTestResult && (
              <Card className={`p-6 shadow-lg ${aiTestResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${aiTestResult.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {aiTestResult.success ? (
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="text-red-600 text-sm">!</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${aiTestResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                        🤖 OpenAI Analysis {aiTestResult.success ? 'Results' : 'Error'}
                      </h3>
                      <Button 
                        onClick={() => setAiTestResult(null)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </Button>
                    </div>
                    
                    {aiTestResult.success ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-sm font-medium text-slate-900">Test Transaction:</p>
                          <p className="text-sm text-slate-600">
                            {aiTestResult.transaction.merchant_name} - ${aiTestResult.transaction.amount}
                          </p>
                          <p className="text-xs text-slate-500">
                            {aiTestResult.transaction.category} • {aiTestResult.transaction.date}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Tax Deductible</p>
                            <p className={`font-bold ${aiTestResult.analysis.is_deductible ? 'text-emerald-600' : 'text-red-600'}`}>
                              {aiTestResult.analysis.is_deductible ? 'YES' : 'NO'}
                            </p>
                          </div>
                          
                          <div className="p-3 bg-white rounded-lg border">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">AI Confidence</p>
                            <p className="font-bold text-blue-600">
                              {aiTestResult.analysis.confidence_percentage}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white rounded-lg border">
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Reasoning</p>
                          <p className="text-sm text-slate-700 italic">
                            "{aiTestResult.analysis.deductible_reason}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-sm text-red-800">
                          {aiTestResult.error}
                        </p>
                      </div>
                    )}
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
                {loadingTransactions ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-slate-600">Loading transactions...</p>
                  </div>
                ) : displayTransactions.length === 0 ? (
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
                              : transaction.is_deductible 
                                ? 'text-blue-600' 
                                : 'text-slate-600'
                          }`}>
                            {transaction.type === 'income' ? 'Revenue' : transaction.is_deductible ? 'Tax Deductible' : 'Expense'}
                          </span>
                          {transaction.deduction_score && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <span className="text-purple-600 font-medium">
                                  🤖 {Math.round((transaction.deduction_score || 0) * 100)}% AI
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {transaction.deductibleReason && transaction.type === 'expense' && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            "{transaction.deductibleReason}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'income' 
                          ? 'text-emerald-600' 
                          : 'text-slate-900'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${(transaction.amount || 0).toLocaleString()}
                      </p>
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
          <div className="space-y-6">
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
