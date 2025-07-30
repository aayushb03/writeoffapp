"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/simple-select';
import { ArrowLeft, Tag, Receipt, DollarSign, Calendar } from 'lucide-react';

interface CategorizeScreenProps {
  onBack: () => void;
  onSave: (category: string, amount: number, description: string) => void;
}

const expenseCategories = [
  'Office Supplies',
  'Travel & Transportation',
  'Meals & Entertainment',
  'Professional Services',
  'Software & Subscriptions',
  'Marketing & Advertising',
  'Equipment & Technology',
  'Utilities',
  'Insurance',
  'Training & Education',
  'Home Office',
  'Other Business Expenses'
];

export const CategorizeScreen: React.FC<CategorizeScreenProps> = ({ onBack, onSave }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    if (category && amount && description) {
      onSave(category, parseFloat(amount), description);
    }
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
              Categorize <span className="text-blue-600 font-bold">Expense</span>
            </h1>
            <p className="text-sm text-slate-600">Add details for tax deduction tracking</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6">
        <Card className="p-8 bg-white border-0 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Expense <span className="text-blue-600 font-bold">Details</span>
              </h3>
              <p className="text-slate-600">Categorize your business expense</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Receipt className="w-4 h-4 inline mr-2" />
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Office supplies from Staples"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl border-2"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!category || !amount || !description}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-300 shadow-lg text-base font-semibold"
            >
              Save Expense
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
