"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  FileText,
  BarChart3
} from 'lucide-react';

interface ProfitLossDetailScreenProps {
  onNavigate: (screen: string) => void;
  transactions?: any[];
}

export const ProfitLossDetailScreen: React.FC<ProfitLossDetailScreenProps> = ({ 
  onNavigate, 
  transactions = [] 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');

  // Sample transactions with revenue and expenses
  const sampleTransactions = [
    { id: '1', description: 'Client Project Payment', amount: 2500.00, category: 'Consulting Revenue', date: '2024-12-28', type: 'income' },
    { id: '2', description: 'Monthly Retainer - ABC Corp', amount: 3000.00, category: 'Retainer Revenue', date: '2024-12-25', type: 'income' },
    { id: '3', description: 'Freelance Design Work', amount: 1200.00, category: 'Design Revenue', date: '2024-12-26', type: 'income' },
    { id: '4', description: 'Product Sales', amount: 850.00, category: 'Product Revenue', date: '2024-12-24', type: 'income' },
    { id: '5', description: 'Office Supplies - Staples', amount: 149.99, category: 'Office Supplies', date: '2024-12-28', type: 'expense' },
    { id: '6', description: 'Adobe Creative Suite', amount: 52.99, category: 'Software & Subscriptions', date: '2024-12-27', type: 'expense' },
    { id: '7', description: 'Client Meeting Lunch', amount: 85.50, category: 'Meals & Entertainment', date: '2024-12-26', type: 'expense' },
    { id: '8', description: 'Marketing Campaign', amount: 450.00, category: 'Marketing', date: '2024-12-23', type: 'expense' },
    { id: '9', description: 'Web Hosting', amount: 29.99, category: 'Technology', date: '2024-12-22', type: 'expense' },
    { id: '10', description: 'Business Insurance', amount: 125.00, category: 'Insurance', date: '2024-12-21', type: 'expense' },
  ];

  const allTransactions = transactions.length > 0 ? transactions : sampleTransactions;
  
  // Calculate P/L metrics
  const revenue = allTransactions.filter(t => t.type === 'income');
  const expenses = allTransactions.filter(t => t.type === 'expense');
  
  const totalRevenue = revenue.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netProfitLoss = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfitLoss / totalRevenue) * 100 : 0;

  // Group by category
  const revenueByCategory = revenue.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const expensesByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={() => onNavigate('dashboard')}
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profit & Loss Statement</h1>
            <p className="text-slate-600">Detailed breakdown of revenue and expenses</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700">Period:</span>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'this-month', label: 'This Month' },
              { key: 'last-month', label: 'Last Month' },
              { key: 'quarter', label: 'This Quarter' },
              { key: 'year', label: 'This Year' }
            ].map((period) => (
              <Button
                key={period.key}
                variant={selectedPeriod === period.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                netProfitLoss >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  netProfitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Net P/L</p>
                <p className={`text-2xl font-bold ${
                  netProfitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {netProfitLoss >= 0 ? '+' : ''}${netProfitLoss.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Profit Margin</p>
                <p className={`text-2xl font-bold ${
                  profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'
                }`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue & Expenses Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Breakdown */}
          <Card className="p-6 bg-white border-0 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Revenue Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(revenueByCategory)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{category}</p>
                      <p className="text-sm text-slate-600">
                        {(((amount as number) / totalRevenue) * 100).toFixed(1)}% of total revenue
                      </p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      ${(amount as number).toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </Card>

          {/* Expenses Breakdown */}
          <Card className="p-6 bg-white border-0 shadow-lg">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Expenses Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(expensesByCategory)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{category}</p>
                      <p className="text-sm text-slate-600">
                        {(((amount as number) / totalExpenses) * 100).toFixed(1)}% of total expenses
                      </p>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      ${(amount as number).toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6 bg-white border-0 shadow-lg mt-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {allTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`font-medium ${
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? 'Revenue' : 'Expense'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
