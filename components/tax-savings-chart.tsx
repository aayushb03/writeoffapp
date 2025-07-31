"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface TaxSavingsData {
  day: number;
  date: string;
  deductibleAmount: number;
  taxSavings: number;
  cumulativeSavings: number;
}

interface TaxSavingsChartProps {
  transactions?: any[];
}

export const TaxSavingsChart: React.FC<TaxSavingsChartProps> = ({ transactions = [] }) => {
  // Generate data from real transactions instead of mock data
  const generateChartData = (): TaxSavingsData[] => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const data: TaxSavingsData[] = [];
    let cumulativeSavings = 0;
    
    for (let day = 1; day <= Math.min(daysInMonth, 31); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Find transactions for this day
      const dayTransactions = transactions.filter(t => {
        const txnDate = new Date(t.date).toISOString().split('T')[0];
        return txnDate === dateString;
      });
      
      // Calculate deductible amount and tax savings for this day
      const deductibleTransactions = dayTransactions.filter(t => t.is_deductible === true);
      const deductibleAmount = deductibleTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const taxSavings = deductibleAmount * 0.3; // 30% tax rate
      
      cumulativeSavings += taxSavings;
      
      data.push({
        day,
        date: dateString,
        deductibleAmount,
        taxSavings,
        cumulativeSavings
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const maxDailySavings = chartData.length > 0 ? Math.max(...chartData.map(d => d.taxSavings)) : 0;
  const totalSavings = chartData.length > 0 ? chartData[chartData.length - 1]?.cumulativeSavings || 0 : 0;
  const avgDailySavings = chartData.length > 0 ? totalSavings / chartData.filter(d => d.taxSavings > 0).length : 0;

  return (
    <Card className="p-6 bg-white border-0 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Daily Tax Savings
          </h3>
          <p className="text-slate-600">Individual daily tax savings from deductible expenses</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">${totalSavings.toFixed(2)}</p>
            <p className="text-sm text-slate-500">Total This Month</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Daily Savings</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-64 mb-6">
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {chartData.map((data, index) => (
            <div key={data.day} className="flex flex-col items-center flex-1 max-w-[20px]">
              {/* Bar */}
              <div 
                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 transition-all duration-300 cursor-pointer relative group shadow-sm"
                style={{
                  height: `${(data.taxSavings / maxDailySavings) * 100}%`,
                  minHeight: data.taxSavings > 0 ? '4px' : '0px',
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <div className="font-medium">Day {data.day}</div>
                  <div>Daily Savings: ${data.taxSavings.toFixed(2)}</div>
                  <div>Running Total: ${data.cumulativeSavings.toFixed(2)}</div>
                  {data.deductibleAmount > 0 && (
                    <div className="text-emerald-300">
                      Expenses: ${data.deductibleAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Day Label */}
              {index % 3 === 0 && (
                <span className="text-xs text-slate-400 mt-2">{data.day}</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 -ml-12">
          <span>${maxDailySavings.toFixed(0)}</span>
          <span>${(maxDailySavings * 0.75).toFixed(0)}</span>
          <span>${(maxDailySavings * 0.5).toFixed(0)}</span>
          <span>${(maxDailySavings * 0.25).toFixed(0)}</span>
          <span>$0</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 border-t pt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Days Active</span>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {chartData.filter(d => d.taxSavings > 0).length}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Avg Daily</span>
          </div>
          <p className="text-lg font-bold text-slate-900">
            ${avgDailySavings.toFixed(2)}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Best Day</span>
          </div>
          <p className="text-lg font-bold text-slate-900">
            ${maxDailySavings.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Monthly Progress</span>
          <span>{Math.round((new Date().getDate() / 31) * 100)}% of month</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(new Date().getDate() / 31) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="mt-3 text-xs text-slate-500 text-center">
        💡 Based on 30% effective tax rate. Each bar shows daily tax savings.
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-slate-700">Smart Insights</span>
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          {avgDailySavings > 50 && (
            <p>🚀 Great job! You're averaging ${avgDailySavings.toFixed(2)} in daily tax savings.</p>
          )}
          {maxDailySavings > 100 && (
            <p>🎯 Your best day saved ${maxDailySavings.toFixed(2)} in taxes!</p>
          )}
          <p>📊 Each bar represents the tax savings from that day's deductible expenses.</p>
        </div>
      </div>
    </Card>
  );
};

export default TaxSavingsChart;
