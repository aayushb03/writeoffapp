"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

// Simple test component to verify button clicks work
export const TestConnectButton: React.FC = () => {
  const handleClick = () => {
    alert('Button clicked!');
    console.log('Button clicked in test component');
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Test Connect Button</h2>
      <Button 
        onClick={handleClick}
        variant="outline"
        className="h-16 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl justify-start gap-4 px-6"
      >
        <Building2 className="w-6 h-6 text-blue-600" />
        <div className="text-left">
          <p className="font-semibold text-slate-900">Test Connect Bank</p>
          <p className="text-xs text-slate-600">Click to test</p>
        </div>
      </Button>
    </div>
  );
};
