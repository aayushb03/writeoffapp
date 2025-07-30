"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';

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

interface DeductionsDetailScreenProps {
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

export const DeductionsDetailScreen: React.FC<DeductionsDetailScreenProps> = ({ 
  user, 
  onBack, 
  transactions 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Year');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const periods = ['This Month', 'Last Month', 'This Quarter', 'This Year', 'All Time'];

  // Filter deductible expenses
  const deductibleTransactions = transactions.filter(t => t.type === 'expense' && t.isDeductible);
  
  // Get unique categories
  const categories = ['All Categories', ...Array.from(new Set(deductibleTransactions.map(t => t.category)))];

  // Apply filters
  const filteredTransactions = deductibleTransactions.filter(transaction => {
    // Category filter
    if (selectedCategory !== 'All Categories' && transaction.category !== selectedCategory) {
      return false;
    }

    // Period filter
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

  const totalDeductions = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const estimatedTaxSavings = totalDeductions * 0.3; // 30% tax rate assumption

  // Group by category for breakdown
  const categoryBreakdown = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = 0;
    }
    acc[transaction.category] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryEntries = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tax Deductions Breakdown</h1>
              <p className="text-sm text-slate-600">Detailed view of your deductible business expenses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Deductions</p>
                <p className="text-2xl font-bold text-slate-900">${totalDeductions.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Estimated Tax Savings</p>
                <p className="text-2xl font-bold text-slate-900">${estimatedTaxSavings.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Deductible Items</p>
                <p className="text-2xl font-bold text-slate-900">{filteredTransactions.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Deductible Expenses</h3>
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
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-slate-500">No deductible expenses found for the selected criteria</p>
                  </div>
                ) : (
                  filteredTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">${transaction.amount.toFixed(2)}</p>
                          <p className="text-xs text-emerald-600">Deductible</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div>
            <Card className="p-6 bg-white border-0 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {categoryEntries.map(([category, amount]) => {
                  const percentage = totalDeductions > 0 ? (amount / totalDeductions) * 100 : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{category}</span>
                        <span className="text-sm text-slate-900">${amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500">{percentage.toFixed(1)}% of total</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Tax Tips */}
            <Card className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 border-0 shadow-xl text-white mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">💡 Deduction Tip</h3>
                <p className="text-sm text-emerald-100">
                  Keep detailed records and receipts for all business expenses. The IRS requires documentation to support your deductions.
                </p>
              </div>
              <Button size="sm" variant="secondary" className="w-full">
                Learn More About Deductions
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
