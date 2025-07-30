"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Filter, Edit, Trash2, FileText, DollarSign, Calendar, Tag } from 'lucide-react';

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
}

export const TransactionsListScreen: React.FC<TransactionsListScreenProps> = ({ 
  user, 
  onBack, 
  onEditTransaction,
  transactions: propTransactions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [sortBy, setSortBy] = useState('date-desc');

  // Default transactions if none provided
  const defaultTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Office Supplies - Staples',
      amount: 149.99,
      category: 'Office Supplies',
      date: '2024-12-28',
      type: 'expense',
      isDeductible: true,
    },
    {
      id: '2',
      description: 'Adobe Creative Suite',
      amount: 52.99,
      category: 'Software & Subscriptions',
      date: '2024-12-27',
      type: 'expense',
      isDeductible: true,
    },
    {
      id: '3',
      description: 'Client Meeting Lunch',
      amount: 85.50,
      category: 'Meals & Entertainment',
      date: '2024-12-26',
      type: 'expense',
      isDeductible: true,
    },
    {
      id: '4',
      description: 'Uber to Client Office',
      amount: 24.75,
      category: 'Travel & Transportation',
      date: '2024-12-25',
      type: 'expense',
      isDeductible: true,
    },
    {
      id: '5',
      description: 'MacBook Pro 16"',
      amount: 2399.99,
      category: 'Equipment & Hardware',
      date: '2024-12-20',
      type: 'expense',
      isDeductible: true,
    },
    {
      id: '6',
      description: 'Website Domain Renewal',
      amount: 12.99,
      category: 'Professional Services',
      date: '2024-12-18',
      type: 'expense',
      isDeductible: true,
    },
    {
      id: '7',
      description: 'Client Payment - Web Design',
      amount: 1500.00,
      category: 'Professional Services',
      date: '2024-12-15',
      type: 'income',
      isDeductible: false,
    }
  ];

  const transactions = propTransactions || defaultTransactions;
  
  const categories = Array.from(new Set(transactions.map(t => t.category)));
  
  const periods = ['All Time', 'This Month', 'Last Month', 'This Quarter', 'This Year'];
  
  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'amount-desc', label: 'Highest Amount' },
    { value: 'amount-asc', label: 'Lowest Amount' },
    { value: 'description', label: 'Description A-Z' }
  ];

  const filteredAndSortedTransactions = transactions
    .filter(transaction => {
      // Search filter
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'All' && transaction.category !== selectedCategory) {
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
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'description':
          return a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });

  const totalAmount = filteredAndSortedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const deductibleAmount = filteredAndSortedTransactions
    .filter(t => t.type === 'expense' && t.isDeductible)
    .reduce((sum, t) => sum + t.amount, 0);

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
              <h1 className="text-xl font-semibold text-slate-900">All Transactions</h1>
              <p className="text-sm text-slate-600">Manage your business expenses and income</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{filteredAndSortedTransactions.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">${totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tax Deductible</p>
                <p className="text-2xl font-bold text-slate-900">${deductibleAmount.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white border-0 shadow-xl mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-40"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-40"
            >
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-40"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="p-6 bg-white border-0 shadow-xl">
          <div className="space-y-4">
            {filteredAndSortedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-slate-500">No transactions found matching your criteria</p>
              </div>
            ) : (
              filteredAndSortedTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-green-100' 
                        : transaction.isDeductible 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        transaction.type === 'income' 
                          ? 'text-green-600' 
                          : transaction.isDeductible 
                            ? 'text-blue-600' 
                            : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{transaction.description}</p>
                        {transaction.type === 'income' && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Income
                          </span>
                        )}
                        {transaction.isDeductible && transaction.type === 'expense' && (
                          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                            Deductible
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-slate-900'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      onClick={() => onEditTransaction(transaction)}
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {filteredAndSortedTransactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
                </p>
                <Button variant="outline" size="sm">
                  Export to CSV
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
