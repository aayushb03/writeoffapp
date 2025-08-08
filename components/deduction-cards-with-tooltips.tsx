"use client";

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface DeductionCardsProps {
  totalDeductions: number;
  taxSavings: number;
}

export const DeductionCardsWithTooltips: React.FC<DeductionCardsProps> = ({
  totalDeductions,
  taxSavings
}) => {
  const [showDeductionsTooltip, setShowDeductionsTooltip] = useState(false);
  const [showSavingsTooltip, setShowSavingsTooltip] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total Deductions Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-2xl font-bold text-gray-900">
            ${totalDeductions.toFixed(0)}
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors"
              onMouseEnter={() => setShowDeductionsTooltip(true)}
              onMouseLeave={() => setShowDeductionsTooltip(false)}
            />
            {showDeductionsTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    These are all your business-related expenses that qualify as tax-deductible based on category rules. The total shown here reflects the sum of deductible portions from all transactions.
                  </p>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45 transform origin-center"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">Total Deductions</div>
      </div>

      {/* Tax Savings Card */}
      <div className="bg-green-100 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-2xl font-bold text-green-700">
            ${taxSavings.toFixed(0)}
          </div>
          <div className="relative">
            <Info
              className="w-4 h-4 text-green-500 hover:text-green-700 cursor-help transition-colors"
              onMouseEnter={() => setShowSavingsTooltip(true)}
              onMouseLeave={() => setShowSavingsTooltip(false)}
            />
            {showSavingsTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    This is your estimated reduction in taxes owed based on your current deductible expenses. It's calculated by multiplying your total deductions by your estimated tax rate.
                  </p>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45 transform origin-center"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-green-600">Tax Savings</div>
      </div>
    </div>
  );
};
