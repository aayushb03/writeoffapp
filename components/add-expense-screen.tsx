"use client";

import React, { useState } from 'react';

const writeOffLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzNiODJmNiIvPgo8cGF0aCBkPSJNOC41IDEwSDIzLjVMMjEuNSAyMkg2LjVMOC41IDEwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEwIDEySDIyTDIwLjUgMjBIOC41TDEwIDEyWiIgZmlsbD0iIzNiODJmNiIvPgo8L3N2Zz4K';

// Icon components
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const LightBulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface EditExpenseScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onBack: () => void;
  onSave: (expense: any) => void;
  editingExpense?: any;
}

const formatCategory = (category: string): string => {
  if (!category) return 'Uncategorized';
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const AddExpenseScreen: React.FC<EditExpenseScreenProps> = ({ 
  user, 
  onBack, 
  onSave, 
  editingExpense 
}) => {
  const [notes, setNotes] = useState(editingExpense?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!editingExpense) return null;

  const getConfidenceConfig = (confidence: number) => {
    if (confidence >= 90) return { 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-200', 
      icon: <CheckCircleIcon />
    };
    if (confidence >= 75) return { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      border: 'border-blue-200', 
      icon: <LightBulbIcon />
    };
    return { 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      border: 'border-amber-200', 
      icon: <ClockIcon />
    };
  };

  const confidenceConfig = getConfidenceConfig(editingExpense.deduction_score ? Math.round(editingExpense.deduction_score * 100) : 0);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleStatusUpdate = (status: string) => {
    setSaving(true);
    setTimeout(() => {
      const updatedExpense = {
        ...editingExpense,
        is_deductible: status === 'auto-deducted' ? true : status === 'not-deductible' ? false : null,
        notes: notes
      };
      onSave(updatedExpense);
      setSaving(false);
      onBack();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <ArrowLeftIcon />
            </button>
            <img src={writeOffLogo} alt="WriteOff" className="h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-medium text-slate-800">Transaction Details</h1>
              <p className="text-sm text-slate-600">AI analysis and categorization</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Transaction Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-medium text-slate-800 mb-2">
                  {editingExpense.merchant_name || editingExpense.description || 'Unknown Merchant'}
                </h2>
                <p className="text-slate-600 mb-6">{editingExpense.description}</p>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-2xl font-semibold text-slate-800">${Math.abs(editingExpense.amount).toFixed(2)}</div>
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                    {formatCategory(editingExpense.category)}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  {new Date(editingExpense.date).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <LightBulbIcon />
                </div>
                <h3 className="font-medium text-slate-800">AI Analysis</h3>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${confidenceConfig.bg} ${confidenceConfig.text} ${confidenceConfig.border}`}>
                  {confidenceConfig.icon}
                  <span className="font-medium">{editingExpense.deduction_score ? Math.round(editingExpense.deduction_score * 100) : 0}%</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-slate-800 leading-relaxed">
                  {editingExpense.deductible_reason || 'AI analysis not available for this transaction.'}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <h3 className="font-medium text-slate-800 mb-4">Add Context</h3>
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Tell us more about this purchase..."
                className="w-full h-24 px-4 py-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 resize-none transition-colors"
              />
              <div className="mt-4">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Placeholder for future functionality
                    console.log('Save notes clicked');
                  }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status & Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <h3 className="font-medium text-slate-800 mb-6">Status</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Classification</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    editingExpense.is_deductible === true ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    editingExpense.is_deductible === false ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {editingExpense.is_deductible === true ? 'Deductible' :
                     editingExpense.is_deductible === false ? 'Personal' : 'Needs Review'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Tax Savings</span>
                  <span className="font-semibold text-emerald-600">
                    {editingExpense.is_deductible === true ? `$${Math.abs(editingExpense.amount).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {editingExpense.is_deductible === null && (
                <div className="space-y-4">
                  <button 
                    onClick={() => handleStatusUpdate('auto-deducted')} 
                    disabled={saving}
                    className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                        <CheckCircleIcon />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-emerald-900">Business Expense</div>
                        <div className="text-xs text-emerald-700">Tax deductible</div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleStatusUpdate('not-deductible')} 
                    disabled={saving}
                    className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
                        <span>✕</span>
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-red-900">Personal Expense</div>
                        <div className="text-xs text-red-700">Not deductible</div>
                      </div>
                    </div>
                  </button>

                  {saving && (
                    <div className="text-center pt-3">
                      <span className="text-xs text-slate-600">Saving changes...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tax Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <h3 className="font-medium text-slate-800 mb-6">Tax Information</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-medium text-blue-900 mb-1">Category</div>
                  <div className="text-sm text-blue-800">{formatCategory(editingExpense.category)}</div>
                </div>
                
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs font-medium text-emerald-900 mb-1">Est. Tax Rate</div>
                  <div className="text-sm text-emerald-800">30%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
