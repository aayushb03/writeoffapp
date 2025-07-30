"use client";

import React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

// Simple native select implementation for now
export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(e.target.value);
  };

  // Extract options from children - simplified approach
  const options: Array<{ value: string; label: string }> = [];
  
  const extractOptions = (children: React.ReactNode) => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if ((child as any).type === SelectContent) {
          extractOptions((child as any).props.children);
        } else if ((child as any).type === SelectItem) {
          options.push({ 
            value: (child as any).props.value, 
            label: (child as any).props.children 
          });
        }
      }
    });
  };

  extractOptions(children);

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`w-full h-12 px-3 py-2 text-base rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-white outline-none ${className || ''}`}
    >
      <option value="">Select an option</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <>{children}</>;
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};
