"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, TrendingUp, DollarSign, Calendar, PieChart, Download } from 'lucide-react';

interface SummaryScreenProps {
  onBack: () => void;
  user: any;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ onBack, user }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  const summaryData = {
    totalExpenses: 12450.75,
    totalDeductions: 8320.50,
    taxSavings: 2496.15,
    categories: [
      { name: 'Office Supplies', amount: 2180.40, percentage: 17.5 },
      { name: 'Travel & Transportation', amount: 3240.30, percentage: 26.0 },
      { name: 'Meals & Entertainment', amount: 1890.25, percentage: 15.2 },
      { name: 'Professional Services', amount: 2450.80, percentage: 19.7 },
      { name: 'Software & Subscriptions', amount: 1680.50, percentage: 13.5 },
      { name: 'Other', amount: 1008.50, percentage: 8.1 }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="h-8 w-24 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold text-sm">WriteOff</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">
              Tax <span className="text-blue-600 font-bold">Summary</span>
            </h1>
            <p className="text-sm text-slate-600">Your deduction overview</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 pb-32">
        {/* Period Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl p-1 shadow-lg">
            {['2023', '2024', 'YTD'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${summaryData.totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tax Deductions</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${summaryData.totalDeductions.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Estimated Savings</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${summaryData.taxSavings.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="p-8 bg-white border-0 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Expense Breakdown</h3>
                <p className="text-slate-600">By category for {selectedPeriod}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {summaryData.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-medium">{category.name}</span>
                    <span className="text-slate-900 font-semibold">
                      ${category.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">{category.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button className="h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl gap-3">
            <Download className="w-5 h-5" />
            Export Tax Report
          </Button>
          
          <Button 
            variant="outline"
            className="h-14 border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl gap-3"
          >
            <Calendar className="w-5 h-5 text-emerald-600" />
            Schedule Review
          </Button>
        </div>
      </div>
    </div>
  );
};
