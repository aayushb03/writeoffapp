"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, DollarSign, FileText, TrendingUp, PieChart } from 'lucide-react';

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

interface ExpensesDetailScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onBack: () => void;
  transactions: Transaction[];
}

export const ExpensesDetailScreen: React.FC<ExpensesDetailScreenProps> = ({ 
  user, 
  onBack, 
  transactions 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Year');
  const [viewType, setViewType] = useState<'all' | 'deductible' | 'personal'>('all');

  const periods = ['This Month', 'Last Month', 'This Quarter', 'This Year', 'All Time'];

  // Filter expenses
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Apply period filter
  const filteredTransactions = expenseTransactions.filter(transaction => {
    if (selectedPeriod !== 'All Time') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      
      switch (selectedPeriod) {
        case 'This Month':
          if (transactionDate.getMonth() !== now.getMonth() || 
              transactionDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
        case 'Last Month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          if (transactionDate.getMonth() !== lastMonth.getMonth() || 
              transactionDate.getFullYear() !== lastMonth.getFullYear()) {
            return false;
          }
          break;
        case 'This Quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
          if (transactionQuarter !== quarter || 
              transactionDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
        case 'This Year':
          if (transactionDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
      }
    }
    return true;
  });

  // Apply view type filter
  const displayTransactions = filteredTransactions.filter(transaction => {
    if (viewType === 'deductible') return transaction.isDeductible;
    if (viewType === 'personal') return !transaction.isDeductible;
    return true;
  });

  const totalExpenses = displayTransactions.reduce((sum, t) => sum + t.amount, 0);
  const deductibleExpenses = displayTransactions.filter(t => t.isDeductible).reduce((sum, t) => sum + t.amount, 0);
  const personalExpenses = displayTransactions.filter(t => !t.isDeductible).reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown
  const categoryBreakdown = displayTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { total: 0, deductible: 0, personal: 0, count: 0 };
    }
    acc[transaction.category].total += transaction.amount;
    acc[transaction.category].count += 1;
    if (transaction.isDeductible) {
      acc[transaction.category].deductible += transaction.amount;
    } else {
      acc[transaction.category].personal += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { total: number; deductible: number; personal: number; count: number }>);

  const categoryEntries = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b.total - a.total);

  // Monthly trend (simplified)
  const monthlyData = displayTransactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) acc[month] = 0;
    acc[month] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyEntries = Object.entries(monthlyData).slice(-6); // Last 6 months

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Expense Analytics</h1>
              <p className="text-sm text-slate-600">Detailed breakdown of your business and personal expenses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Business Expenses</p>
                <p className="text-2xl font-bold text-slate-900">${deductibleExpenses.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Personal Expenses</p>
                <p className="text-2xl font-bold text-slate-900">${personalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{displayTransactions.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Expenses List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Expense Details</h3>
                <div className="flex gap-3">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {periods.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                  <select
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Expenses</option>
                    <option value="deductible">Business Only</option>
                    <option value="personal">Personal Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {displayTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-slate-500">No expenses found for the selected criteria</p>
                  </div>
                ) : (
                  displayTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.isDeductible ? 'bg-emerald-100' : 'bg-gray-100'
                          }`}>
                            <CreditCard className={`w-4 h-4 ${
                              transaction.isDeductible ? 'text-emerald-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className={transaction.isDeductible ? 'text-emerald-600' : 'text-gray-600'}>
                                {transaction.isDeductible ? 'Business' : 'Personal'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">${transaction.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Card>
          </div>

          {/* Category Breakdown & Monthly Trend */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-0 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                {categoryEntries.slice(0, 6).map(([category, data]) => {
                  const percentage = totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{category}</span>
                        <span className="text-sm text-slate-900">${data.total.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${data.deductible / data.total * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-400 h-2 rounded-full"
                            style={{ width: `${data.personal / data.total * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{data.count} items</span>
                        <span>{percentage.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                    <span>Business</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Personal</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-0 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Trend</h3>
              <div className="space-y-3">
                {monthlyEntries.map(([month, amount]) => {
                  const maxAmount = Math.max(...monthlyEntries.map(([,amt]) => amt));
                  const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                  return (
                    <div key={month} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{month}</span>
                        <span className="text-sm text-slate-900">${amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
