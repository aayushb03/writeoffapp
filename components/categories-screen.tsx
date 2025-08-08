"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Building, Settings, Info, Home } from 'lucide-react';

const writeOffLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzMzNjZDQyIvPgo8dGV4dCB4PSIxNiIgeT0iMjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XPC90ZXh0Pgo8L3N2Zz4K';

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

interface CategoriesScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onBack: () => void;
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
}

const formatCategory = (category: string): string => {
  if (!category) return 'Uncategorized';
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('office') || categoryLower.includes('equipment')) {
    return <Building className="w-5 h-5 text-blue-600" />;
  } else if (categoryLower.includes('software') || categoryLower.includes('tools')) {
    return <Settings className="w-5 h-5 text-purple-600" />;
  } else if (categoryLower.includes('transportation') || categoryLower.includes('travel')) {
    return <Info className="w-5 h-5 text-green-600" />;
  } else if (categoryLower.includes('meals') || categoryLower.includes('entertainment') || categoryLower.includes('food')) {
    return <Home className="w-5 h-5 text-orange-600" />;
  }
  return <Building className="w-5 h-5 text-gray-600" />;
};

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ 
  user, 
  onBack, 
  transactions,
  onTransactionClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeductionsTooltip, setShowDeductionsTooltip] = useState(false);
  const [showSavingsTooltip, setShowSavingsTooltip] = useState(false);

  // Filter deductible transactions
  const deductibleTransactions = transactions.filter(t => t.is_deductible === true && t.amount > 0);

  // Debug what we're receiving
  console.log('Categories Screen - transactions received:', transactions);
  console.log('Categories Screen - transactions length:', transactions.length);
  console.log('Categories Screen - deductible transactions:', deductibleTransactions);
  console.log('Categories Screen - deductible transactions length:', deductibleTransactions.length);

  // Group transactions by category
  const categoryGroups = deductibleTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Calculate category totals and percentages
  const totalDeductions = deductibleTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryData = Object.entries(categoryGroups).map(([category, transactions]) => {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalDeductions > 0 ? (totalAmount / totalDeductions) * 100 : 0;
    const taxSavings = totalAmount * 0.3; // 30% tax rate
    
    return {
      category,
      transactions,
      totalAmount,
      percentage,
      taxSavings,
      transactionCount: transactions.length
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  // Filter categories based on search
  const filteredCategories = categoryData.filter(cat => 
    formatCategory(cat.category).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Calculate total tax savings directly from total deductions
  const totalTaxSavings = totalDeductions * 0.30;
  const activeCategories = categoryData.length;

  return (
    <div className="min-h-screen bg-[#3366CC]">
      {/* Header */}
      <div className="bg-[#3366CC] border-b border-white/10 sticky top-0 z-50">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-white/80 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src={writeOffLogo} alt="WriteOff" className="h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-medium text-white">Categories</h1>
              <p className="text-sm text-white/70">Tax deduction breakdown</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">{activeCategories}</div>
            <div className="text-sm text-gray-600">Active Categories</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-gray-900">${totalDeductions.toFixed(0)}</div>
              <div className="relative">
                <Info
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
                  onMouseEnter={() => setShowDeductionsTooltip(true)}
                  onMouseLeave={() => setShowDeductionsTooltip(false)}
                />
                {showDeductionsTooltip && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-lg p-3 w-80 border border-gray-100">
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-white border-l border-t border-gray-100 rotate-45 transform origin-center"></div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        These are all your business-related expenses that qualify as tax-deductible based on category rules. The total shown here reflects the sum of deductible portions from all transactions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">Total Deductions</div>
          </div>
          
          <div className="bg-green-100 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-green-700">${totalTaxSavings.toFixed(0)}</div>
              <div className="relative">
                <Info
                  className="w-4 h-4 text-green-500 hover:text-green-700 cursor-help transition-colors"
                  onMouseEnter={() => setShowSavingsTooltip(true)}
                  onMouseLeave={() => setShowSavingsTooltip(false)}
                />
                {showSavingsTooltip && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-lg p-3 w-80 border border-gray-100">
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-white border-l border-t border-gray-100 rotate-45 transform origin-center"></div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        This is your estimated reduction in taxes owed based on your current deductible expenses. It's calculated by multiplying your total deductions by your estimated tax rate.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-green-600">Tax Savings</div>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-4">
          {filteredCategories.map((categoryData) => {
            const isExpanded = expandedCategories.has(categoryData.category);
            
            return (
              <div key={categoryData.category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        {getCategoryIcon(categoryData.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {formatCategory(categoryData.category)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {categoryData.transactionCount} transaction{categoryData.transactionCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold text-gray-900">
                          ${categoryData.totalAmount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => toggleCategory(categoryData.category)}
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        +${categoryData.taxSavings.toFixed(0)} saved
                      </div>
                      <div className="text-xs text-gray-500">
                        {categoryData.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(categoryData.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Transactions */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Transactions in this category</h4>
                      <div className="space-y-3">
                        {categoryData.transactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200"
                            onClick={() => onTransactionClick?.(transaction)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {transaction.merchant_name || transaction.description || 'Unknown Merchant'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(transaction.date).toLocaleDateString('en-US', { 
                                      month: '2-digit', day: '2-digit', year: 'numeric'
                                    })} • {transaction.description || 'Transaction'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-blue-600">
                                    {transaction.deduction_score ? Math.round(transaction.deduction_score * 100) : 0}%
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    ${transaction.amount.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-green-600 font-medium">
                                    +${(transaction.amount * 0.3).toFixed(0)} saved
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};
