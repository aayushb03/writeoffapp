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

import React, { useState, useEffect } from 'react';

const writeOffLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzMzNjZDQyIvPgo8dGV4dCB4PSIxNiIgeT0iMjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XPC90ZXh0Pgo8L3N2Zz4K';

// Icon components
const DollarSignIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BarChartIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LogOutIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

interface DashboardScreenProps {
  profile: any;
  transactions: any[];
  onNavigate: (screen: string) => void;
  onTransactionClick: (transaction: any) => void;
  onAnalyzeTransactions?: () => void;
  analyzingTransactions?: boolean;
  onSignOut?: () => void;
}

// Helper function to format category names
const formatCategory = (category: string): string => {
  if (!category) return 'Needs review';
  return category
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function DashboardScreen({ 
  profile, 
  transactions, 
  onNavigate, 
  onTransactionClick,
  onAnalyzeTransactions,
  analyzingTransactions = false,
  onSignOut
}: DashboardScreenProps) {
  const [analysisResult, setAnalysisResult] = useState<{analyzed: number, total: number} | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<{current: number, total: number} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taxSavingsData, setTaxSavingsData] = useState<any>(null);
  const [loadingTaxSavings, setLoadingTaxSavings] = useState(true);

  // Fetch tax savings data
  useEffect(() => {
    const fetchTaxSavings = async () => {
      if (!profile?.user_id) return;
      
      try {
        setLoadingTaxSavings(true);
        const response = await fetch(`/api/tax-savings?userId=${profile.user_id}`);
        if (response.ok) {
          const data = await response.json();
          setTaxSavingsData(data.data);
        } else {
          console.error('Failed to fetch tax savings data');
        }
      } catch (error) {
        console.error('Error fetching tax savings:', error);
      } finally {
        setLoadingTaxSavings(false);
      }
    };

    fetchTaxSavings();
  }, [profile?.user_id]);
  if (!transactions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Use tax savings data from API if available, otherwise fall back to local calculations
  const taxSavings = taxSavingsData?.taxSavings?.yearToDate || 0;
  const projectedAnnualSavings = taxSavingsData?.taxSavings?.projectedAnnual || 0;
  const currentMonthDeductions = taxSavingsData?.deductions?.currentMonth || 0;
  const monthlyTargetPercentage = taxSavingsData?.deductions?.monthlyTargetPercentage || 0;

  let totalDeductions = 0;
  let uncategorizedCount = 0;

  // Calculate transactions that need review (uncategorized OR low confidence)
  const needsReviewCount = transactions.filter(t => 
    t.is_deductible === null || // Uncategorized transactions
    (t.deduction_score !== undefined && t.deduction_score < 0.75) // Low confidence transactions
  ).length;

  // Fallback calculations if API data not available
  if (!taxSavingsData) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      if (transaction && transaction.is_deductible === true && transaction.amount) {
        // Use savings_percentage to calculate actual deductible amount
        const deductibleAmount = transaction.amount * (transaction.savings_percentage || 100) / 100;
        totalDeductions += deductibleAmount;
      }
      
      if (transaction && (transaction.is_deductible === null || (transaction.deduction_score !== undefined && transaction.deduction_score < 0.75))) {
        uncategorizedCount++;
      }
    }
  } else {
    totalDeductions = taxSavingsData.deductions.yearToDate;
    uncategorizedCount = needsReviewCount;
  }

  const categoryBreakdown: Record<string, number> = {};
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    if (transaction && transaction.is_deductible === true && transaction.category && transaction.amount) {
      // Use savings_percentage to calculate actual deductible amount
      const deductibleAmount = transaction.amount * (transaction.savings_percentage || 100) / 100;
      if (categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] += deductibleAmount;
      } else {
        categoryBreakdown[transaction.category] = deductibleAmount;
      }
    }
  }

  const categoryEntries = [];
  for (const category in categoryBreakdown) {
    categoryEntries.push([category, categoryBreakdown[category]]);
  }
  
  categoryEntries.sort((a, b) => (b[1] as number) - (a[1] as number));
  const topCategories = categoryEntries.slice(0, 3);

  // Debug logging
  console.log('📊 Category breakdown:', {
    totalTransactions: transactions.length,
    deductibleTransactions: transactions.filter(t => t.is_deductible === true).length,
    categoryBreakdown,
    topCategories
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Header - Desktop Only */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 hidden lg:block">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <img src={writeOffLogo} alt="WriteOff" className="h-6 lg:h-8" />
            <h1 className="text-lg lg:text-xl font-medium text-slate-800">WriteOff</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('settings')} 
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <SettingsIcon />
            </button>
            {onSignOut && (
              <button 
                onClick={onSignOut} 
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOutIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 lg:py-5">
        {/* Welcome Section */}
        <div className="mb-6 lg:mb-8 animate-[fadeIn_0.4s_ease-out_forwards]">
          <div className="text-center mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3 tracking-tight">
              Welcome back, <span className="text-white">{profile?.name?.split(' ')[0] || 'there'}</span>
            </h2>
            <p className="text-blue-100 text-base lg:text-lg font-bold">
              Here's your tax optimization overview
            </p>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-10">
            <button
              onClick={() => onNavigate('transactions')}
              className="group bg-white/95 hover:bg-white border border-white/20 hover:border-blue-200 rounded-xl p-4 lg:p-6 text-left transition-all duration-200 shadow-lg hover:shadow-xl animate-[slideInLeft_0.4s_ease-out_0.1s_both]"
            >
              <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  <DollarSignIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl lg:text-2xl font-semibold text-slate-800 mb-1">
                    ${taxSavings.toFixed(0)}
                  </div>
                  <div className="text-xs lg:text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Tax Savings
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs lg:text-sm text-slate-600 font-medium mb-1">
                  Total saved this year
                </p>
                <p className="text-xs text-slate-500">
                  Projected: <span className="font-semibold text-slate-800">${projectedAnnualSavings.toFixed(0)}</span> annually
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('transactions')}
              className="group bg-white/95 hover:bg-white border border-white/20 hover:border-blue-200 rounded-xl p-4 lg:p-6 text-left transition-all duration-200 shadow-lg hover:shadow-xl animate-[fadeIn_0.4s_ease-out_0.2s_both]"
            >
              <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <TrendingUpIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl lg:text-2xl font-semibold text-slate-800 mb-1">
                    ${currentMonthDeductions.toFixed(0)}
                  </div>
                  <div className="text-xs lg:text-sm font-bold text-slate-600 uppercase tracking-wide">
                    New Deductions
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs lg:text-sm text-slate-600 font-medium mb-1">
                  This month so far
                </p>
                <p className="text-xs text-slate-500">
                  {Math.min(monthlyTargetPercentage, 100).toFixed(0)}% of monthly target
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate(uncategorizedCount > 0 ? 'review-transactions' : 'transactions')}
              className={`group bg-white/95 hover:bg-white border rounded-xl p-4 lg:p-6 text-left transition-all duration-200 shadow-lg hover:shadow-xl animate-[slideInRight_0.4s_ease-out_0.3s_both] sm:col-span-2 lg:col-span-1 ${
                uncategorizedCount > 0
                  ? 'border-amber-200 hover:border-amber-300'
                  : 'border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center ${
                  uncategorizedCount > 0 
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {uncategorizedCount > 0 ? <ClockIcon /> : <CheckCircleIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl lg:text-2xl font-semibold text-slate-800 mb-1">
                    {uncategorizedCount > 0 ? uncategorizedCount : '✓'}
                  </div>
                  <div className="text-xs lg:text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Next Step
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs lg:text-sm text-slate-600 font-medium mb-1">
                  {uncategorizedCount > 0 ? 'Review transactions with low confidence' : 'All caught up!'}
                </p>
                <p className="text-xs text-slate-500">
                  {uncategorizedCount > 0 ? 'Review uncategorized and low-confidence transactions' : 'Everything is organized'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-5">
            {/* Top Categories */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg animate-[scaleIn_0.3s_ease-out_0.4s_both]">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <h3 className="text-base lg:text-lg font-bold text-slate-800">Top Deductible Categories</h3>
                  <button 
                    onClick={() => onNavigate('categories')} 
                    className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-blue-50 text-sm transition-colors"
                  >
                    View All
                  </button>
                </div>
                
                <div>
                  {topCategories.length > 0 ? (
                    <div className="space-y-3 lg:space-y-4">
                      {topCategories.map((categoryData) => {
                        const category = categoryData[0] as string;
                        const amount = categoryData[1] as number;
                        const percentage = totalDeductions > 0 ? (amount / totalDeductions) * 100 : 0;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-800 text-sm lg:text-base">{formatCategory(category)}</span>
                              <div className="text-right">
                                <span className="font-semibold text-slate-800 text-sm lg:text-base">${amount.toFixed(0)}</span>
                                <span className="text-xs lg:text-sm text-slate-600 ml-1 lg:ml-2">(${(amount * 0.3).toFixed(0)} saved)</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 lg:py-8 text-slate-600">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                        <BarChartIcon />
                      </div>
                      <p className="text-sm lg:text-base">Start tracking expenses to see category breakdown</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analyze Transactions Button */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <SparklesIcon />
                    </div>
                    <h3 className="text-base lg:text-lg font-bold text-slate-800">AI Analysis</h3>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setIsAnalyzing(true);
                      setAnalysisResult(null);
                      setAnalysisProgress(null);
                      
                      try {
                        // Check if profile exists before proceeding
                        if (!profile || !profile.user_id) {
                          console.error('Profile or user_id not available');
                          setAnalysisResult({
                            analyzed: 0,
                            total: 0
                          });
                          return;
                        }

                        // Call the analysis API directly
                        const response = await fetch('/api/openai/analyze-with-progress', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ userId: profile.user_id }),
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                          setAnalysisResult({
                            analyzed: result.analyzed,
                            total: result.total
                          });
                          
                          // Refresh transactions to show updated analysis
                          if (onAnalyzeTransactions) {
                            await onAnalyzeTransactions();
                          }
                        } else {
                          console.error('Analysis failed:', result.error);
                          setAnalysisResult({
                            analyzed: 0,
                            total: 0
                          });
                        }
                      } catch (error) {
                        console.error('Error during analysis:', error);
                        setAnalysisResult({
                          analyzed: 0,
                          total: 0
                        });
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    disabled={isAnalyzing || !profile?.user_id}
                    className={`w-full p-4 lg:p-5 rounded-lg border transition-all duration-200 text-left group ${
                      isAnalyzing || !profile?.user_id
                        ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                        : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <SparklesIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 text-sm lg:text-base">
                          {!profile?.user_id ? 'Loading...' : 'Analyze Transactions with AI'}
                        </div>
                        <p className="text-xs lg:text-sm text-slate-600">
                          {!profile?.user_id 
                            ? 'Please wait while we load your profile...' 
                            : 'Use AI to automatically categorize and identify tax deductions'
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Analysis Progress Popup */}
                  {isAnalyzing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-blue-800 mb-1">
                            Analyzing Transactions...
                          </div>
                          <p className="text-sm text-blue-700">
                            Processing transactions with AI analysis
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Result Popup */}
                  {analysisResult && !isAnalyzing && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircleIcon />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-emerald-800 mb-1">
                            Analysis Complete!
                          </div>
                          <p className="text-sm text-emerald-700">
                            Successfully analyzed {analysisResult.analyzed} out of {analysisResult.total} transactions
                          </p>
                        </div>
                        <button 
                          onClick={() => setAnalysisResult(null)}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <h3 className="text-base lg:text-lg font-bold text-slate-800">Recent Activity</h3>
                  <button 
                    onClick={() => onNavigate('transactions')} 
                    className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-blue-50 text-sm transition-colors"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => {
                    const isIncome = transaction.amount < 0;
                    const amount = Math.abs(transaction.amount);
                    
                    let statusIndicator = 'bg-amber-200';
                    if (transaction.is_deductible === true) {
                      statusIndicator = 'bg-emerald-200';
                    } else if (transaction.is_deductible === false) {
                      statusIndicator = 'bg-red-200';
                    }
                    
                    return (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-3 lg:p-4 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors"
                        onClick={() => onTransactionClick(transaction)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${statusIndicator} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors text-sm lg:text-base truncate">
                              {transaction.merchant_name || transaction.description || 'Unknown Merchant'}
                            </div>
                            <div className="text-xs lg:text-sm text-slate-600 truncate">
                              {isIncome ? 'Income' : formatCategory(transaction.category)} • {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className={`font-semibold text-sm lg:text-base ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isIncome ? '+' : ''}${amount.toFixed(2)}
                          </div>
                          {transaction.is_deductible === true && !isIncome && transaction.savings_percentage !== undefined && transaction.savings_percentage > 0 && (
                            <div className="text-xs text-emerald-600">+${(amount * transaction.savings_percentage / 100 * 0.3).toFixed(2)} saved</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-5">
            {/* Progress Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/20 p-4 lg:p-6 shadow-lg">
              <h3 className="font-bold text-slate-800 mb-4 text-sm lg:text-base">2024 Tax Year Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs lg:text-sm text-slate-600">Deductions Tracked</span>
                    <span className="font-semibold text-slate-800 text-sm lg:text-base">${totalDeductions.toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((totalDeductions / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Goal: $10,000 annual deductions</div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs lg:text-sm text-slate-600 mb-1">Projected Annual</div>
                  <div className="text-lg lg:text-xl font-semibold text-emerald-600">${projectedAnnualSavings.toFixed(0)}</div>
                  <div className="text-xs text-slate-500">in tax savings</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/20 p-4 lg:p-6 shadow-lg">
              <h3 className="font-bold text-slate-800 mb-4 text-sm lg:text-base">Quick Actions</h3>
              <div className="space-y-3">
                {uncategorizedCount > 0 && (
                  <button 
                    onClick={() => onNavigate('review-transactions')} 
                    className="w-full p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-amber-200 rounded-lg flex items-center justify-center text-amber-700">
                        <ClockIcon />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm lg:text-base">Review Transactions</div>
                        <div className="text-xs lg:text-sm text-slate-600">{uncategorizedCount} pending</div>
                      </div>
                    </div>
                  </button>
                )}
                <button 
                  onClick={() => onNavigate('transactions')} 
                  className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700">
                      <FileTextIcon />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm lg:text-base">View All Transactions</div>
                      <div className="text-xs lg:text-sm text-slate-600">Manage your expenses</div>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => onNavigate('schedule-c-export')} 
                  className="w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-200 rounded-lg flex items-center justify-center text-blue-700">
                      <FileTextIcon />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm lg:text-base">Export Schedule C</div>
                      <div className="text-xs lg:text-sm text-slate-600">Download tax forms</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
