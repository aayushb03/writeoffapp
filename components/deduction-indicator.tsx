"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeductionIndicatorProps {
  isDeductible: boolean;
  confidenceScore?: number;
  deductibleReason?: string;
  compact?: boolean;
}

export const DeductionIndicator: React.FC<DeductionIndicatorProps> = ({
  isDeductible,
  confidenceScore = 0,
  deductibleReason,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine color and text based on deduction status and confidence
  const getDeductionStyle = () => {
    // For all transactions, show the confidence score
    if (confidenceScore >= 0.8) {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        scoreColor: 'bg-green-500',
        label: isDeductible ? 'Likely Deductible' : 'High Confidence'
      };
    } else if (confidenceScore >= 0.5) {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        scoreColor: 'bg-yellow-500',
        label: isDeductible ? 'Possibly Deductible' : 'Medium Confidence'
      };
    } else if (confidenceScore > 0) {
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        scoreColor: 'bg-orange-500',
        label: isDeductible ? 'Unlikely Deductible' : 'Low Confidence'
      };
    } else {
      // If confidence score is 0, check if it's been analyzed
      if (deductibleReason) {
        // Has been analyzed but determined not deductible
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          scoreColor: 'bg-red-500',
          label: 'Not Deductible'
        };
      } else {
        // Has not been analyzed yet
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          scoreColor: 'bg-gray-500',
          label: 'Not Analyzed'
        };
      }
    }
  };

  const style = getDeductionStyle();
  const scorePercentage = Math.round(confidenceScore * 100);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${style.scoreColor} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xs font-bold">{scorePercentage}</span>
          </div>
          <span className={`text-xs font-medium ${style.textColor} flex-shrink-0`}>
            {style.label}
          </span>
          {deductibleReason && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent parent onClick from triggering
                setIsExpanded(!isExpanded);
              }}
              className="p-1 h-auto text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>
        
        {/* Expanded reasoning for compact mode */}
        {isExpanded && deductibleReason && (
          <div className="ml-8">
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 border border-gray-200">
              <div className="flex items-start gap-3">
                <Info className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed text-gray-700">{deductibleReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${style.borderColor} ${style.bgColor} p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${style.scoreColor} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">{scorePercentage}</span>
          </div>
          <div>
            <p className={`font-semibold ${style.textColor}`}>{style.label}</p>
            <p className="text-xs text-gray-600">Confidence Score</p>
          </div>
        </div>
        
        {deductibleReason && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent parent onClick from triggering
              setIsExpanded(!isExpanded);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {isExpanded && deductibleReason && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">{deductibleReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 