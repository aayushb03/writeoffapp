"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { updateTransaction } from '@/lib/database/transactions';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Bot,
  AlertTriangle,
  DollarSign,
  Calendar,
  Tag,
  MessageSquare,
  Building2,
  User
} from 'lucide-react';

interface TransactionDetailScreenProps {
  transaction: {
    id: string;
    merchant_name: string;
    amount: number;
    date: string;
    category: string;
    description?: string;
    notes?: string;
    is_deductible?: boolean | null;
    deductible_reason?: string;
    deduction_score?: number;
    deduction_percent?: number;
    savings_percentage?: number;
    estimated_deduction_percent?: number | null;
  };
  onBack: () => void;
  onSave: (updatedTransaction: any) => void;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  transaction,
  onBack,
  onSave
}) => {
  const [classification, setClassification] = useState<'business' | 'personal'>(
    transaction.is_deductible === null || (transaction.deduction_score !== undefined && transaction.deduction_score < 0.75)
      ? 'personal' // Default to personal for needs review items
      : transaction.is_deductible 
        ? 'business' 
        : 'personal'
  );
  const [additionalContext, setAdditionalContext] = useState(transaction.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Pull deductible percentage strictly from DB-provided fields (no forced 100 default)
  const rawDeductPercent = transaction.savings_percentage ?? transaction.deduction_percent ?? transaction.estimated_deduction_percent ?? null;
  const deductiblePercent = rawDeductPercent !== null ? Math.round(rawDeductPercent) : 0;
  const estimatedTaxRatePercent = 31; // fixed for now
  // Deductible savings amount = deductible portion of the expense (not applying tax rate)
  const deductibleSavingsAmount = classification === 'business' && rawDeductPercent !== null
    ? (Math.abs(transaction.amount) * (rawDeductPercent / 100))
    : 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        is_deductible: classification === 'business',
        deductible_reason: classification === 'business' 
          ? (additionalContext || 'Classified as business expense by user')
          : 'Classified as personal expense by user',
        notes: additionalContext ? additionalContext : (transaction.notes ? transaction.notes : undefined)
      };
      const { error } = await updateTransaction(transaction.id, updates);
      if (error) {
        console.error('Error updating transaction:', error);
        alert('Failed to save changes. Please try again.');
        return;
      }
      const updatedTransaction = {
        ...transaction,
        is_deductible: updates.is_deductible,
        deductible_reason: updates.deductible_reason,
        notes: updates.notes || undefined,
      };
      await onSave(updatedTransaction);
      alert('Changes saved successfully!');
      onBack();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getClassificationStatus = () => {
    if (transaction.deduction_score === undefined || transaction.deduction_score === null) return 'unknown';
    if (transaction.deduction_score >= 0.75) return 'confident';
    if (transaction.deduction_score >= 0.2) return 'needs-review';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confident': return 'text-emerald-600';
      case 'needs-review': return 'text-orange-600';
      case 'low': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confident': return 'High Confidence';
      case 'needs-review': return 'Needs Review';
      case 'low': return 'Low Confidence';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      {/* Header */}
      <div className="bg-transparent border-b border-blue-400/30 sticky top-0 z-50">
        <div className="flex items-center justify-between p-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white mb-1">
              Transaction Details
            </h1>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transaction Info & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Header Card */}
            <Card className="p-6 bg-white rounded-3xl border-0 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {transaction.merchant_name ? transaction.merchant_name.charAt(0).toUpperCase() : 'T'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{transaction.merchant_name}</h2>
                    <p className="text-gray-500 text-sm">{new Date(transaction.date).toLocaleDateString('en-US', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-emerald-600 text-sm font-medium">
                    {classification === 'business' ? `${deductiblePercent}% deductible` : '0% deductible'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full">
                  {transaction.category}
                </Badge>
                {transaction.description && (
                  <span className="text-gray-600 text-sm">{transaction.description}</span>
                )}
              </div>
            </Card>

            {/* AI Analysis Card */}
            <Card className="p-6 bg-white rounded-3xl border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">AI Analysis</span>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {transaction.deduction_score ? Math.round(transaction.deduction_score * 100) : 0}%
                </Badge>
              </div>
              
              <p className="text-gray-700 mb-6">
                {transaction.deductible_reason || 'This transaction has not been analyzed yet.'}
              </p>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Key Analysis Factors</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Merchant: {transaction.merchant_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Category: {transaction.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">Amount: ${Math.abs(transaction.amount).toFixed(2)}</span>
                  </div>
                  {transaction.deduction_score && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm text-gray-700">Confidence Score: {Math.round(transaction.deduction_score * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Add Context Card */}
            <Card className="p-6 bg-white rounded-3xl border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Context</h3>
              <Textarea
                placeholder="Tell us more about this purchase..."
                value={additionalContext}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalContext(e.target.value)}
                className="min-h-[120px] rounded-xl border-gray-200 bg-gray-50"
              />
            </Card>
          </div>

          {/* Right Column - Status & Tax Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6 bg-white rounded-3xl border-0 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Classification</span>
                  <Badge className={`border-0 rounded-full ${
                    transaction.is_deductible === null || (transaction.deduction_score !== undefined && transaction.deduction_score < 0.75)
                      ? 'bg-orange-100 text-orange-700'
                      : classification === 'business' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.is_deductible === null || (transaction.deduction_score !== undefined && transaction.deduction_score < 0.75)
                      ? 'Needs Review'
                      : classification === 'business' 
                        ? 'Deductible' 
                        : 'Not Deductible'
                    }
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Deductible %</span>
                  <span className="font-semibold text-emerald-600">{classification === 'business' ? `${deductiblePercent}%` : '0%'}</span>
                </div>
              </div>

              {/* Classification Toggle */}
              <div className="space-y-3">
                <button
                  onClick={() => setClassification('business')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 ${
                    classification === 'business'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      classification === 'business' ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}>
                      {classification === 'business' ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Building2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Business Expense</p>
                      <p className="text-sm opacity-75">Tax deductible</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setClassification('personal')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 ${
                    classification === 'personal'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      classification === 'personal' ? 'bg-red-600' : 'bg-gray-300'
                    }`}>
                      {classification === 'personal' ? (
                        <XCircle className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Personal Expense</p>
                      <p className="text-sm opacity-75">Not deductible</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* Tax Information Card */}
            <Card className="p-6 bg-white rounded-3xl border-0 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Tax Information</h3>
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Estimated Tax Rate</div>
                  <div className="font-medium text-emerald-700">{estimatedTaxRatePercent}%</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Deductible Savings Amount</div>
                  <div className="font-medium text-blue-700">
                    ${deductibleSavingsAmount.toFixed(2)} {classification === 'business' && rawDeductPercent !== null ? `(${deductiblePercent}%)` : '(0%)'}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <div className="flex justify-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="h-12 px-8 rounded-2xl border-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 px-8 bg-white text-blue-600 hover:bg-gray-100 rounded-2xl transition-all duration-300 shadow-lg font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
