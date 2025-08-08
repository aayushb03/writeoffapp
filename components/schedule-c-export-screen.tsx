"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

interface ScheduleCExportScreenProps {
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

interface CategorySummary {
  category: string;
  lineItem: string;
  amount: number;
  transactionCount: number;
}

export const ScheduleCExportScreen: React.FC<ScheduleCExportScreenProps> = ({
  user,
  onBack,
  transactions
}) => {
  const [selectedYear, setSelectedYear] = useState('2025'); // Default to current year
  const [exportFormat, setExportFormat] = useState('CSV (Spreadsheet)');
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [totalDeductible, setTotalDeductible] = useState(0);
  const [deductibleCount, setDeductibleCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [potentialCount, setPotentialCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [lineDetails, setLineDetails] = useState<Record<string, { confirmed: number; potential: number; amount: number; transactions: Transaction[] }>>({});
  const supabase = createClient();

  // Category mapping to Schedule C line items
  const categoryToScheduleC: { [key: string]: string } = {
    // Meals
    'FOOD_AND_DRINK_COFFEE_SHOP': 'Meals',
    'FOOD_AND_DRINK_FAST_FOOD': 'Meals',
    'FOOD_AND_DRINK_RESTAURANT': 'Meals',
    'FOOD_AND_DRINK_ALCOHOL_AND_BARS': 'Meals',

    // Office expense
    'GENERAL_MERCHANDISE_OFFICE_SUPPLIES': 'Office expense',
    'GENERAL_MERCHANDISE_COMPUTERS_AND_ELECTRONICS': 'Office expense',
    'GENERAL_MERCHANDISE_HOME_IMPROVEMENT': 'Office expense',
    'GENERAL_MERCHANDISE_PHARMACY': 'Office expense',
    'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE': 'Office expense',
    'SERVICE_SHIPPING': 'Office expense',
    'SERVICE_UTILITIES': 'Office expense',
    'SERVICE_STORAGE': 'Office expense',

    // Professional services
    'SERVICE_ACCOUNTING': 'Professional services',
    'SERVICE_CONSULTING': 'Professional services',
    'SERVICE_LEGAL': 'Professional services',
    'SERVICE_MARKETING': 'Professional services',
    'SERVICE_ADVERTISING': 'Professional services',
    'SERVICE_SECURITY': 'Professional services',
    'SERVICE_INSURANCE': 'Professional services',

    // Car and truck expenses
    'TRANSPORTATION_RIDESHARE': 'Car and truck expenses',
    'TRANSPORTATION_AUTO_PARKING': 'Car and truck expenses',
    'TRANSPORTATION_AUTO_REPAIR': 'Car and truck expenses',
    'TRANSPORTATION_AUTO_SERVICE': 'Car and truck expenses',
    'TRANSPORTATION_FUEL': 'Car and truck expenses',
    'TRANSPORTATION_TOLLS': 'Car and truck expenses',
    'TRANSPORTATION_AUTO_INSURANCE': 'Car and truck expenses',

    // Travel
    'TRAVEL_FLIGHTS': 'Travel',
    'TRAVEL_LODGING': 'Travel',
    'TRAVEL_OTHER_TRAVEL': 'Travel',

    // Other expenses
    'ENTERTAINMENT_SPORTS_AND_OUTDOORS': 'Other expenses',
    'ENTERTAINMENT_ARTS': 'Other expenses',
    'ENTERTAINMENT_THEATER': 'Other expenses',
    'ENTERTAINMENT_MUSIC': 'Other expenses',
    'ENTERTAINMENT_MOVIES_AND_DVDS': 'Other expenses',
    'GENERAL_MERCHANDISE_SPORTING_GOODS': 'Other expenses',
    'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS': 'Other expenses',
    'COMMUNITY_CHARITY': 'Other expenses',
    'COMMUNITY_EDUCATION': 'Other expenses',
    'COMMUNITY_RELIGIOUS': 'Other expenses',
  };

  const potentialBusinessCategories = [
    // Meals
    'FOOD_AND_DRINK_COFFEE_SHOP',
    'FOOD_AND_DRINK_FAST_FOOD',
    'FOOD_AND_DRINK_RESTAURANT',
    'FOOD_AND_DRINK_ALCOHOL_AND_BARS',

    // Office expense
    'GENERAL_MERCHANDISE_OFFICE_SUPPLIES',
    'GENERAL_MERCHANDISE_COMPUTERS_AND_ELECTRONICS',
    'GENERAL_MERCHANDISE_HOME_IMPROVEMENT',
    'GENERAL_MERCHANDISE_PHARMACY',
    'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE',
    'SERVICE_SHIPPING',
    'SERVICE_UTILITIES',
    'SERVICE_STORAGE',

    // Professional services
    'SERVICE_ACCOUNTING',
    'SERVICE_CONSULTING',
    'SERVICE_LEGAL',
    'SERVICE_MARKETING',
    'SERVICE_ADVERTISING',
    'SERVICE_SECURITY',
    'SERVICE_INSURANCE',

    // Car and truck expenses
    'TRANSPORTATION_RIDESHARE',
    'TRANSPORTATION_AUTO_PARKING',
    'TRANSPORTATION_AUTO_REPAIR',
    'TRANSPORTATION_AUTO_SERVICE',
    'TRANSPORTATION_FUEL',
    'TRANSPORTATION_TOLLS',
    'TRANSPORTATION_AUTO_INSURANCE',

    // Travel
    'TRAVEL_FLIGHTS',
    'TRAVEL_LODGING',
    'TRAVEL_OTHER_TRAVEL',

    // Other expenses
    'ENTERTAINMENT_SPORTS_AND_OUTDOORS',
    'ENTERTAINMENT_ARTS',
    'ENTERTAINMENT_THEATER',
    'ENTERTAINMENT_MUSIC',
    'ENTERTAINMENT_MOVIES_AND_DVDS',
    'GENERAL_MERCHANDISE_SPORTING_GOODS',
    'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS',
    'COMMUNITY_CHARITY',
    'COMMUNITY_EDUCATION',
    'COMMUNITY_RELIGIOUS',
  ];

  useEffect(() => {
    calculateDeductions();
    // Optionally refresh latest year transactions from Supabase for most up-to-date preview
    // (non-blocking; silently fails if RLS prevents)
    const fetchLatest = async () => {
      try {
        const start = `${selectedYear}-01-01`;
        const end = `${selectedYear}-12-31`;
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', start)
          .lte('date', end);
        if (data && Array.isArray(data) && data.length > 0) {
          // Map trans_id -> id for internal consistency if needed
          const mapped = data.map((t: any) => ({
            id: t.trans_id || t.id,
            merchant_name: t.merchant_name,
            amount: t.amount,
            category: t.category,
            date: t.date,
            type: t.type,
            is_deductible: t.is_deductible,
            deductible_reason: t.deductible_reason,
            deduction_score: t.deduction_score,
            description: t.description,
            notes: t.notes,
          }));
          // Re-run calculation with freshest data merged (prefer latest for selected year)
          calculateDeductions(mapped as any);
        }
      } catch (e) {
        // silent
      }
    };
    fetchLatest();
    // Debug logging
    console.log('🔍 Schedule C Debug Info:', {
      totalTransactions: transactions.length,
      selectedYear,
      yearTransactions: transactions.filter(t => new Date(t.date).getFullYear().toString() === selectedYear).length,
      deductibleTypes: transactions.reduce((acc, t) => {
        const key = t.is_deductible === null ? 'null' : t.is_deductible ? 'true' : 'false';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as any),
      businessCategoryCount: transactions.filter(t =>
        potentialBusinessCategories.includes(t.category) &&
        new Date(t.date).getFullYear().toString() === selectedYear &&
        t.amount > 0
      ).length,
      sampleTransactions: transactions.slice(0, 3).map(t => ({
        merchant: t.merchant_name,
        amount: t.amount,
        category: t.category,
        is_deductible: t.is_deductible,
        date: t.date
      }))
    });
  }, [transactions, selectedYear]);

  const calculateDeductions = (overrideYearTx?: Transaction[]) => {
    // Filter transactions for selected year
    const sourceTx = overrideYearTx ? overrideYearTx : transactions;
    const yearTransactions = sourceTx.filter(t => {
      const transactionYear = new Date(t.date).getFullYear().toString();
      return transactionYear === selectedYear;
    });

    // Filter for confirmed deductible transactions
    const confirmedDeductible = yearTransactions.filter(t =>
      t.is_deductible === true
    );

    // Find potentially deductible transactions (business categories) 
    // where is_deductible is null or undefined (not yet reviewed)
    const potentiallyDeductible = yearTransactions.filter(t =>
      (t.is_deductible === null || t.is_deductible === undefined) &&
      potentialBusinessCategories.includes(t.category) &&
      t.amount > 0 // Only expenses, not income
    );

    const allDeductibleTransactions = [...confirmedDeductible, ...potentiallyDeductible];
    // Build per-line details for improved preview
    const perLine: Record<string, { confirmed: number; potential: number; amount: number; transactions: Transaction[] }> = {};
    allDeductibleTransactions.forEach(t => {
      const lineItem = categoryToScheduleC[t.category] || 'Other expenses';
      const key = lineItem;
      if (!perLine[key]) perLine[key] = { confirmed: 0, potential: 0, amount: 0, transactions: [] };
      perLine[key].amount += Math.abs(t.amount);
      perLine[key].transactions.push(t);
      if (t.is_deductible === true) perLine[key].confirmed += 1; else perLine[key].potential += 1;
    });
    setLineDetails(perLine);

    setDeductibleCount(allDeductibleTransactions.length);
    setConfirmedCount(confirmedDeductible.length);
    setPotentialCount(potentiallyDeductible.length);

    console.log('🔍 Deduction Calculation Debug:', {
      yearTransactions: yearTransactions.length,
      confirmedDeductible: confirmedDeductible.length,
      potentiallyDeductible: potentiallyDeductible.length,
      allDeductible: allDeductibleTransactions.length,
      samplePotentialCategories: potentiallyDeductible.slice(0, 5).map(t => ({
        merchant: t.merchant_name,
        category: t.category,
        amount: t.amount,
        is_deductible: t.is_deductible
      }))
    });

    // Group by Schedule C categories
    const categoryGroups: { [key: string]: { amount: number; count: number; category: string } } = {};

    allDeductibleTransactions.forEach(transaction => {
      const scheduleCCategory = categoryToScheduleC[transaction.category] || 'Other expenses';

      if (!categoryGroups[scheduleCCategory]) {
        categoryGroups[scheduleCCategory] = {
          amount: 0,
          count: 0,
          category: scheduleCCategory
        };
      }

      categoryGroups[scheduleCCategory].amount += Math.abs(transaction.amount);
      categoryGroups[scheduleCCategory].count += 1;
    });

    // Convert to array and sort by amount
    const summaries: CategorySummary[] = Object.entries(categoryGroups)
      .map(([lineItem, data]) => ({
        category: data.category,
        lineItem: lineItem,
        amount: data.amount,
        transactionCount: data.count
      }))
      .sort((a, b) => b.amount - a.amount);

    setCategorySummaries(summaries);

    const total = summaries.reduce((sum, cat) => sum + cat.amount, 0);
    setTotalDeductible(total);
  };

  const getScheduleCLineNumber = (lineItem: string): string => {
    const lineNumbers: { [key: string]: string } = {
      'Meals': '24b',
      'Office expense': '18',
      'Professional services': '17',
      'Car and truck expenses': '9',
      'Travel': '24a',
      'Other expenses': '27a'
    };
    return lineNumbers[lineItem] || '27a';
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Get all transactions for the selected year
      const yearTransactions = transactions.filter(t => {
        const transactionYear = new Date(t.date).getFullYear().toString();
        return transactionYear === selectedYear;
      });

      // Include both confirmed and potentially deductible transactions
      const confirmedDeductible = yearTransactions.filter(t => t.is_deductible === true);
      const potentiallyDeductible = yearTransactions.filter(t =>
        t.is_deductible === null &&
        potentialBusinessCategories.includes(t.category) &&
        t.amount > 0
      );

      const allDeductibleTransactions = [...confirmedDeductible, ...potentiallyDeductible];

      // Prepare export data
      const exportData = {
        year: selectedYear,
        format: exportFormat,
        summary: {
          confirmedDeductible: confirmedDeductible.length,
          potentiallyDeductible: potentiallyDeductible.length,
          totalTransactions: allDeductibleTransactions.length,
          scheduleCCategories: categorySummaries.length,
          totalBusinessExpenses: totalDeductible
        },
        categories: categorySummaries,
        transactions: allDeductibleTransactions,
        lineDetails
      };

      if (exportFormat === 'CSV (Spreadsheet)') {
        // Generate CSV
        const csvContent = generateCSV(exportData);
        downloadFile(csvContent, `schedule-c-${selectedYear}.csv`, 'text/csv');
      } else {
        // Generate PDF (placeholder)
        alert('PDF export will be available soon!');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: any): string => {
    const headers = [
      'Date',
      'Merchant',
      'Category',
      'Schedule C Line',
      'Amount',
      'Status',
      'Description'
    ];

    const rows = data.transactions.map((t: Transaction) => [
      t.date,
      t.merchant_name,
      t.category,
      getScheduleCLineNumber(categoryToScheduleC[t.category] || 'Other expenses'),
      Math.abs(t.amount).toFixed(2),
      t.is_deductible === true ? 'Confirmed Deductible' : 'Potentially Deductible',
      t.description || t.deductible_reason || t.notes || ''
    ]);

    return [headers, ...rows].map(row =>
      row.map((field: any) => `"${field}"`).join(',')
    ).join('\n');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-slate-900">Schedule C Export</h1>
            <p className="text-sm text-slate-600">Export your business expenses for tax filing</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Export Configuration */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CSV (Spreadsheet)">CSV (Spreadsheet)</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6">
            <Button
              onClick={handleExport}
              disabled={isExporting || categorySummaries.length === 0}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : `Export ${selectedYear} Schedule C Data`}
            </Button>
          </div>
        </Card>

        {/* Schedule C Preview */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Schedule C Preview - Tax Year {selectedYear}
          </h3>

          {/* Enhanced Form Style Preview */}
          {categorySummaries.length > 0 && (
            <div className="mb-10">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Form 1040 - Schedule C (Draft Preview)</h4>
                <p className="text-xs text-slate-500">Part II - Expenses (aggregated from your classified and potential business transactions)</p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Line</th>
                      <th className="px-3 py-2 text-left font-medium">Expense Category</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 text-right font-medium">% of Total</th>
                      <th className="px-3 py-2 text-right font-medium">Confirmed</th>
                      <th className="px-3 py-2 text-right font-medium">Potential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {categorySummaries.map(summary => {
                      const line = getScheduleCLineNumber(summary.lineItem);
                      const det = lineDetails[summary.lineItem];
                      const pct = totalDeductible > 0 ? (summary.amount / totalDeductible) * 100 : 0;
                      return (
                        <tr key={summary.lineItem} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{line}</td>
                          <td className="px-3 py-2 text-slate-800">{summary.lineItem}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">{formatCurrency(summary.amount)}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{pct.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-right text-emerald-600 font-medium">{det?.confirmed || 0}</td>
                          <td className="px-3 py-2 text-right text-amber-600 font-medium">{det?.potential || 0}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100 font-semibold">
                      <td className="px-3 py-2 font-mono text-xs">28</td>
                      <td className="px-3 py-2">Total Expenses</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(totalDeductible)}</td>
                      <td className="px-3 py-2 text-right">100%</td>
                      <td className="px-3 py-2 text-right">{Object.values(lineDetails).reduce((s,d)=>s+d.confirmed,0)}</td>
                      <td className="px-3 py-2 text-right">{Object.values(lineDetails).reduce((s,d)=>s+d.potential,0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-500">This table is a dynamic approximation for planning. Always verify with the official IRS form and a tax professional.</p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-800 mb-1">{confirmedCount}</div>
              <div className="text-sm text-emerald-600">Confirmed Deductible</div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-800 mb-1">{potentialCount}</div>
              <div className="text-sm text-yellow-600">Needs Review</div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-800 mb-1">{categorySummaries.length}</div>
              <div className="text-sm text-blue-600">Schedule C Categories</div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-800 mb-1">{formatCurrency(totalDeductible)}</div>
              <div className="text-sm text-purple-600">Total Business Expenses</div>
            </div>
          </div>

          {/* IRS Schedule C Line Items */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">IRS Schedule C Line Items</h4>

            {categorySummaries.length > 0 ? (
              <div className="space-y-3">
                {categorySummaries.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-white/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                        {getScheduleCLineNumber(category.lineItem)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{category.lineItem}</div>
                        <div className="text-sm text-gray-600">
                          {category.transactionCount} transaction{category.transactionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(category.amount)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="border-t border-blue-100 pt-4 mt-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-bold text-gray-900">
                      Total Business Expenses (Line 28)
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                      {formatCurrency(totalDeductible)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-200">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No deductible business expenses found for {selectedYear}</p>
                <p className="text-sm mb-4 text-slate-300">Make sure to categorize your transactions as business expenses first.</p>
                {potentialCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <p className="text-yellow-800 font-medium">💡 Found {potentialCount} transactions that might be deductible</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Go to "Review Transactions" to classify these as business expenses.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50/90 backdrop-blur-sm rounded-xl border border-blue-200 shadow-lg">
          <h4 className="font-semibold text-blue-900 mb-3">How to use this export:</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Download the CSV file and open it in Excel or Google Sheets</li>
            <li>• Use the Schedule C line numbers to enter amounts in your tax software</li>
            <li>• Keep the detailed transaction records for your tax files</li>
            <li>• Consult with your tax professional for proper filing</li>
          </ul>

          {potentialCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 font-medium text-sm">
                📝 Note: This export includes {potentialCount} potentially deductible transactions that haven't been confirmed yet.
                Review these in the "Review Transactions" section before filing.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
