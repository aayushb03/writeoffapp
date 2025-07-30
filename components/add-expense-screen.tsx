"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign, FileText, Calendar, Tag, Save } from 'lucide-react';

interface AddExpenseScreenProps {
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

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ 
  user, 
  onBack, 
  onSave, 
  editingExpense 
}) => {
  const [formData, setFormData] = useState({
    description: editingExpense?.description || '',
    amount: editingExpense?.amount || '',
    category: editingExpense?.category || 'Office Supplies',
    date: editingExpense?.date || new Date().toISOString().split('T')[0],
    isDeductible: editingExpense?.isDeductible ?? true,
    notes: editingExpense?.notes || ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    'Office Supplies',
    'Software & Subscriptions',
    'Meals & Entertainment',
    'Travel & Transportation',
    'Professional Services',
    'Equipment & Hardware',
    'Marketing & Advertising',
    'Training & Education',
    'Utilities',
    'Rent & Facilities',
    'Insurance',
    'Other'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const expense = {
        id: editingExpense?.id || Date.now().toString(),
        ...formData,
        amount: parseFloat(formData.amount),
        type: 'expense' as const,
        userId: user.id,
        createdAt: editingExpense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In a real app, you'd save this to your database
      console.log('Saving expense:', expense);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(expense);
      onBack();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h1>
              <p className="text-sm text-slate-600">
                {editingExpense ? 'Update expense details' : 'Track a new business expense'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 bg-white border-0 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Description *
              </Label>
              <div className="relative">
                <FileText className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  id="description"
                  type="text"
                  placeholder="e.g., Office Supplies - Staples"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                  Amount *
                </Label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                  Date *
                </Label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                Category *
              </Label>
              <div className="relative">
                <Tag className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tax Deductible */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Tax Status
              </Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deductible"
                    checked={formData.isDeductible}
                    onChange={() => handleInputChange('isDeductible', true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">Tax Deductible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deductible"
                    checked={!formData.isDeductible}
                    onChange={() => handleInputChange('isDeductible', false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">Personal Expense</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Notes (Optional)
              </Label>
              <textarea
                id="notes"
                placeholder="Additional details about this expense..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button type="button" onClick={onBack} variant="outline">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingExpense ? 'Update Expense' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
