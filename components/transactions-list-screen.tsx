"use client";

import React, { useState, useEffect } from 'react';

const writeOffLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzMzNjZDQyIvPgo8dGV4dCB4PSIxNiIgeT0iMjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XPC90ZXh0Pgo8L3N2Zz4K';

// Icon components
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  date: string;
  category: string;
  is_deductible?: boolean | null;
  deduction_score?: number;
  deductible_reason?: string;
  savings_percentage?: number;
  description?: string;
  type?: 'expense' | 'income';
}

interface TransactionsListScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onBack: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  transactions?: Transaction[];
  defaultStatusFilter?: string;
}

const formatCategory = (category: string): string => {
  if (!category) return 'Uncategorized';
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const TransactionsListScreen: React.FC<TransactionsListScreenProps> = ({ 
  user, 
  onBack, 
  onEditTransaction,
  transactions: propTransactions,
  defaultStatusFilter 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter || 'all');
  const [showFilters, setShowFilters] = useState(defaultStatusFilter === 'needs-review');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/transactions?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Fetched transactions:', data.transactions);
          setTransactions(data.transactions || []);
        } else {
          console.error('Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!propTransactions) {
      fetchTransactions();
    } else {
      setTransactions(propTransactions);
      setLoading(false);
    }
  }, [propTransactions]);

  // Calculate totals
  const totalTransactions = transactions.length;
  const totalExpenses = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const taxDeductible = transactions
    .filter(t => t.amount > 0 && t.is_deductible === true)
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.category && transaction.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'deductible' && transaction.is_deductible === true) ||
      (statusFilter === 'not-deductible' && transaction.is_deductible === false) ||
      (statusFilter === 'needs-review' && (
        transaction.is_deductible === null || 
        (transaction.deduction_score !== undefined && transaction.deduction_score < 0.75)
      ));
    
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (transaction: Transaction) => {
    const isIncome = transaction.amount < 0;
    
    // For income transactions, use trending up icon
    if (isIncome) {
      return { 
        icon: <TrendingUpIcon />,
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        iconBg: 'bg-emerald-100',
        status: 'Income'
      };
    }
    
    // For expense transactions, use normal deduction logic
    if (transaction.is_deductible === true && !(transaction.deduction_score !== undefined && transaction.deduction_score < 0.75)) {
      return { 
        icon: <CheckCircleIcon />,
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        iconBg: 'bg-emerald-100',
        status: 'Deductible'
      };
    } else if (transaction.is_deductible === false && !(transaction.deduction_score !== undefined && transaction.deduction_score < 0.75)) {
      return { 
        icon: <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-red-600 font-medium">✕</span>,
        bg: 'bg-red-50', 
        border: 'border-red-200',
        text: 'text-red-700',
        iconBg: 'bg-red-100',
        status: 'Not Deductible'
      };
    } else {
      // Includes uncategorized transactions OR low confidence transactions
      return { 
        icon: <ClockIcon />,
        bg: 'bg-amber-50', 
        border: 'border-amber-200',
        text: 'text-amber-700',
        iconBg: 'bg-amber-100',
        status: 'Needs Review'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Compact Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Back Button - Desktop Only */}
            <button 
              onClick={onBack} 
              className="hidden lg:flex w-8 h-8 lg:w-10 lg:h-10 rounded-lg items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {/* Logo and Title */}
            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
              <img src={writeOffLogo} alt="WriteOff" className="h-5 lg:h-6 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base lg:text-lg font-bold text-slate-800 truncate">
                  {defaultStatusFilter === 'needs-review' ? 'Review Transactions' : 'All Transactions'}
                </h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md ml-2 lg:ml-4">
              <div className="relative">
                <SearchIcon className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 lg:h-10 pl-8 lg:pl-10 pr-3 lg:pr-4 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                />
              </div>
            </div>

            {/* Filter Toggle - Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <FilterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Filter Dropdown - Desktop */}
            <div className="hidden lg:block">
              <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="deductible">Deductible</option>
                  <option value="needs-review">Needs Review</option>
                  <option value="not-deductible">Not Deductible</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collapsible Mobile Filter */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-200 lg:hidden">
              <div className="relative">
                <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setShowFilters(false);
                  }}
                  className="w-full h-10 pl-10 pr-8 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="deductible">Deductible</option>
                  <option value="needs-review">Needs Review</option>
                  <option value="not-deductible">Not Deductible</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Summary Cards - Now in scrollable content */}
          <div className="hidden lg:block col-span-1">
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                <div className="text-lg lg:text-xl font-semibold text-white">{totalTransactions}</div>
                <div className="text-xs lg:text-sm font-bold text-white/80">Total Transactions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                <div className="text-lg lg:text-xl font-semibold text-white">${totalExpenses.toFixed(0)}</div>
                <div className="text-xs lg:text-sm font-bold text-white/80">Total Expenses</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                <div className="text-lg lg:text-xl font-semibold text-white">${taxDeductible.toFixed(0)}</div>
                <div className="text-xs lg:text-sm font-bold text-white/80">Tax Deductible</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const statusConfig = getStatusConfig(transaction);
                return (
                  <div
                    key={transaction.id}
                    onClick={() => onEditTransaction(transaction)}
                    className={`group relative bg-white rounded-xl p-4 border ${statusConfig.border} hover:shadow-md transition-all duration-200 cursor-pointer`}
                  >
                    <div className="flex items-center justify-between gap-3 lg:gap-4">
                      <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.iconBg} ${statusConfig.text}`}>
                          {statusConfig.icon}
                        </div>
                        
                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
                            <h3 className="font-medium text-slate-800 text-sm lg:text-base truncate">
                              {transaction.merchant_name || transaction.description || 'Unknown Merchant'}
                            </h3>
                            
                            {transaction.deduction_score && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex-shrink-0">
                                <LightBulbIcon className="w-4 h-4" />
                                <span>{Math.round(transaction.deduction_score * 100)}%</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs lg:text-sm text-slate-600">
                            <span className="font-medium text-blue-600 truncate">
                              {transaction.amount < 0 ? 'Income' : formatCategory(transaction.category)}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex-shrink-0">{new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                          
                          {transaction.deductible_reason && (
                            <p className="text-xs lg:text-sm text-slate-600 mt-1 truncate lg:whitespace-normal">
                              {transaction.deductible_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm lg:text-lg font-semibold ${transaction.amount < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {transaction.amount < 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </div>
                        {transaction.is_deductible === true && transaction.amount > 0 && transaction.savings_percentage !== undefined && transaction.savings_percentage > 0 && (
                          <div className="text-xs lg:text-sm text-emerald-600 font-medium">
                            +${(Math.abs(transaction.amount) * transaction.savings_percentage / 100 * 0.3).toFixed(2)} saved
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Empty State */}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 lg:py-20">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-6">
                    <FileTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 lg:mb-3">No transactions found</h3>
                  <p className="text-white/80 text-sm">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
