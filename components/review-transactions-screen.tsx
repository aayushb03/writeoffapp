"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
  savings_percentage?: number;
  deduction_percent?: number;
}

interface ReviewTransactionsScreenProps {
  user: { id: string; email?: string; user_metadata?: { name?: string } };
  onBack: () => void;
  transactions: Transaction[];
  onTransactionUpdate: (updatedTransaction: Transaction) => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

export const ReviewTransactionsScreen: React.FC<ReviewTransactionsScreenProps> = ({
  user,
  onBack,
  transactions,
  onTransactionUpdate,
  onTransactionClick
}) => {
  const supabase = createClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Record<string, string>>({});

  // Needs review = AI confidence between 20% and 75% and not yet user classified (is_deductible still null)
  const needsReviewTransactions = transactions.filter(t => {
    if (t.is_deductible !== null && t.is_deductible !== undefined) return false; // already classified
    if (t.deduction_score === undefined || t.deduction_score === null) return false;
    return t.deduction_score >= 0.2 && t.deduction_score < 0.75;
  });

  const optimisticUpdate = (transaction: Transaction, isDeductible: boolean) => {
    const updated: Transaction = {
      ...transaction,
      is_deductible: isDeductible,
      deductible_reason: isDeductible
        ? 'Classified as business expense by user'
        : 'Classified as personal expense by user'
    };
    onTransactionUpdate(updated);
    return updated;
  };

  const revertUpdate = (original: Transaction) => {
    onTransactionUpdate(original);
  };

  const handleClassification = async (transaction: Transaction, isDeductible: boolean) => {
    if (processingIds.has(transaction.id)) return;
    setProcessingIds(prev => new Set(prev).add(transaction.id));
    setErrorIds(prev => ({ ...prev, [transaction.id]: '' }));

    const original = { ...transaction };
    const updated = optimisticUpdate(transaction, isDeductible);

    try {
      // Persist to Supabase (RLS should restrict by account ownership). Update by trans_id.
      const { error } = await supabase
        .from('transactions')
        .update({
          is_deductible: updated.is_deductible,
          deductible_reason: updated.deductible_reason
        })
        .eq('trans_id', transaction.id);

      if (error) {
        console.error('Supabase update error:', error);
        setErrorIds(prev => ({ ...prev, [transaction.id]: 'Save failed' }));
        // revert optimistic change
        revertUpdate(original);
        return;
      }
    } catch (e: any) {
      console.error('Unexpected update error:', e);
      setErrorIds(prev => ({ ...prev, [transaction.id]: 'Save failed' }));
      revertUpdate(original);
    } finally {
      setProcessingIds(prev => { const n = new Set(prev); n.delete(transaction.id); return n; });
    }
  };

  const formatCategory = (category: string): string => {
    if (!category) return 'Uncategorized';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' & ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Review Transactions</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-lg px-3 py-2 text-white/70 text-sm">🔍 Search...</div>
            <div className="bg-white/10 rounded-lg px-3 py-2 text-white/70 text-sm">📅 All Dates</div>
            <div className="bg-white/10 rounded-lg px-3 py-2 text-white/70 text-sm">🏷️ All Categories</div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Summary Alert */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-orange-800 mb-1">{needsReviewTransactions.length} transactions need your review</h3>
            <p className="text-orange-700 text-sm">AI couldn't confidently categorize these transactions. Your input helps improve accuracy.</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {needsReviewTransactions.map((transaction) => {
            const isProcessing = processingIds.has(transaction.id);
            const confidenceScore = transaction.deduction_score ? Math.round(transaction.deduction_score * 100) : 0;
            const errorMsg = errorIds[transaction.id];
            return (
              <div key={transaction.id} className="bg-white rounded-2xl p-6 shadow-lg">
                {/* Transaction Header */}
                <div
                  className={`flex items-start justify-between mb-4 ${onTransactionClick ? 'cursor-pointer hover:bg-gray-50 -m-3 p-3 rounded-xl transition-colors' : ''}`}
                  onClick={onTransactionClick ? () => onTransactionClick(transaction) : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{transaction.merchant_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <span>{formatCategory(transaction.category)}</span>
                        <span>•</span>
                        <span>{new Date(transaction.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                        {confidenceScore > 0 && (
                          <>
                            <span>•</span>
                            <Badge className="bg-blue-100 text-blue-700 text-xs">🤖 {confidenceScore}%</Badge>
                          </>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{transaction.description || transaction.deductible_reason || 'No additional details available'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${Math.abs(transaction.amount).toFixed(2)}</div>
                    <div className="text-sm text-orange-600 font-medium">Needs Review</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleClassification(transaction, true)}
                    disabled={isProcessing}
                    className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isProcessing ? 'Saving...' : 'Mark as Deductible'}
                  </Button>
                  <Button
                    onClick={() => handleClassification(transaction, false)}
                    disabled={isProcessing}
                    variant="destructive"
                    className="h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    {isProcessing ? 'Saving...' : 'Mark as Personal'}
                  </Button>
                </div>
                {errorMsg && (
                  <div className="mt-3 text-xs text-red-600 font-medium">{errorMsg} – please retry.</div>
                )}
              </div>
            );
          })}

          {needsReviewTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
              <p className="text-blue-100">No transactions need review at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
