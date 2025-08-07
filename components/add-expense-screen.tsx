"use client";

import React, { useState } from 'react';

const writeOffLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzMzNjZDQyIvPgo8dGV4dCB4PSIxNiIgeT0iMjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XPC90ZXh0Pgo8L3N2Zz4K';

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
  const [analyzing, setAnalyzing] = useState(false);

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

  const handleSaveNotes = async () => {
    if (!notes.trim()) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch('/api/openai/analyze-single-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: editingExpense.id,
          notes: notes.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Notes saved and transaction re-analyzed');
        // Update the local expense with new analysis
        const updatedExpense = {
          ...editingExpense,
          notes: notes.trim(),
          is_deductible: result.analysis.is_deductible,
          deductible_reason: result.analysis.deductible_reason,
          deduction_score: result.analysis.deduction_score,
          savings_percentage: result.analysis.savings_percentage
        };
        onSave(updatedExpense);
      } else {
        console.error('❌ Failed to save notes:', result.error);
      }
    } catch (error) {
      console.error('❌ Error saving notes:', error);
    } finally {
      setAnalyzing(false);
    }
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
    <div className="min-h-screen bg-[#3366CC]">
      {/* Header */}
      <div className="bg-[#3366CC] border-b border-white/10 sticky top-0 z-50">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 rounded-lg flex items-center justify-center text-white hover:text-white/80 hover:bg-white/10 transition-colors">
              <ArrowLeftIcon />
            </button>
            <img src={writeOffLogo} alt="WriteOff" className="h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-medium text-white">Transaction Details</h1>
              <p className="text-sm text-white/70">AI analysis and categorization</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Transaction Info */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {(editingExpense.merchant_name || editingExpense.description || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {editingExpense.merchant_name || editingExpense.description || 'Unknown Merchant'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {new Date(editingExpense.date).toLocaleDateString('en-US', { 
                        month: '2-digit', day: '2-digit', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${Math.abs(editingExpense.amount).toFixed(2)}</div>
                    {editingExpense.is_deductible === true && (
                      <div className="text-sm text-green-600 font-medium">+${((Math.abs(editingExpense.amount) * 0.3)).toFixed(2)} saved</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {formatCategory(editingExpense.category)}
                  </span>
                  {editingExpense.description && (
                    <span className="text-sm text-gray-600">{editingExpense.description}</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <LightBulbIcon />
                </div>
                <h3 className="font-semibold text-gray-900">AI Analysis</h3>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-semibold text-green-600">{editingExpense.deduction_score ? Math.round(editingExpense.deduction_score * 100) : 0}%</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-800 leading-relaxed mb-4">
                  {editingExpense.deductible_reason || 'AI analysis not available for this transaction.'}
                </p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Analysis Factors</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Business hours timing</li>
                    <li>• Downtown business district location</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Add Context</h3>
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Tell us more about this purchase..."
                className="w-full h-24 px-4 py-3 rounded-lg border border-gray-200 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 resize-none transition-colors"
              />
              <div className="mt-4">
                <button 
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    analyzing 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={handleSaveNotes}
                  disabled={analyzing || !notes.trim()}
                >
                  {analyzing ? 'Analyzing...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status & Actions */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-6">Status</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classification</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    editingExpense.is_deductible === true ? 'bg-green-100 text-green-700 border border-green-200' :
                    editingExpense.is_deductible === false ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {editingExpense.is_deductible === true ? 'Deductible' :
                     editingExpense.is_deductible === false ? 'Personal' : 'Needs Review'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tax Savings</span>
                  <span className="font-semibold text-green-600">
                    {editingExpense.is_deductible === true && editingExpense.savings_percentage !== undefined && editingExpense.savings_percentage > 0
                      ? `$${((Math.abs(editingExpense.amount) * editingExpense.savings_percentage / 100) * 0.3).toFixed(2)}`
                      : '$0.00'
                    }
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
                      <span className="text-xs text-gray-600">Saving changes...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tax Info */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-6">Tax Information</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-medium text-blue-900 mb-1">Category</div>
                  <div className="text-sm text-blue-800">{formatCategory(editingExpense.category)}</div>
                </div>
                
                {editingExpense.savings_percentage !== undefined && editingExpense.savings_percentage > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs font-medium text-green-900 mb-1">Est. Tax Rate</div>
                    <div className="text-sm text-green-800">
                      {editingExpense.savings_percentage}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
