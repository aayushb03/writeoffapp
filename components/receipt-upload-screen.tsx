"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Upload, FileText, Camera, CheckCircle, AlertCircle } from 'lucide-react';

interface ReceiptUploadScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onBack: () => void;
  onUploadComplete: (receiptData: any) => void;
}

export const ReceiptUploadScreen: React.FC<ReceiptUploadScreenProps> = ({ 
  user, 
  onBack, 
  onUploadComplete 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadComplete(false);
      setExtractedData(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setUploadComplete(false);
      setExtractedData(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock extracted data
      const mockData = {
        merchant: "Staples Office Supplies",
        amount: 149.99,
        date: new Date().toISOString().split('T')[0],
        category: "Office Supplies",
        items: [
          { description: "Paper Clips", amount: 12.99 },
          { description: "Printer Paper", amount: 24.99 },
          { description: "Pens (Pack of 12)", amount: 15.99 },
          { description: "Stapler", amount: 29.99 },
          { description: "Tax", amount: 11.03 }
        ]
      };
      
      setExtractedData(mockData);
      setUploadComplete(true);
    } catch (error) {
      console.error('Error processing receipt:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmData = () => {
    if (extractedData) {
      const expense = {
        id: Date.now().toString(),
        description: `${extractedData.merchant} - Receipt Upload`,
        amount: extractedData.amount,
        category: extractedData.category,
        date: extractedData.date,
        type: 'expense' as const,
        isDeductible: true,
        userId: user.id,
        receipt: {
          fileName: selectedFile?.name,
          extractedData: extractedData
        },
        createdAt: new Date().toISOString()
      };
      
      onUploadComplete(expense);
      onBack();
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
              <h1 className="text-xl font-semibold text-slate-900">Upload Receipt</h1>
              <p className="text-sm text-slate-600">Scan and automatically extract expense data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="p-8 bg-white border-0 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Upload Receipt</h3>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-slate-700 mb-2">Drop your receipt here</p>
                <p className="text-sm text-slate-500 mb-4">or click to browse files</p>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                {selectedFile.type.startsWith('image/') && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Receipt preview"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={processReceipt}
                    disabled={isUploading}
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Process Receipt
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setExtractedData(null);
                      setUploadComplete(false);
                    }}
                    variant="outline"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Extracted Data Section */}
          <Card className="p-8 bg-white border-0 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Extracted Data</h3>
            
            {!extractedData ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-slate-500">Upload and process a receipt to see extracted data</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Data extracted successfully!</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Merchant</label>
                    <p className="text-slate-900 font-medium">{extractedData.merchant}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Amount</label>
                      <p className="text-slate-900 font-medium">${extractedData.amount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Date</label>
                      <p className="text-slate-900 font-medium">{extractedData.date}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <p className="text-slate-900 font-medium">{extractedData.category}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Items</label>
                    <div className="space-y-2">
                      {extractedData.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded">
                          <span className="text-sm text-slate-700">{item.description}</span>
                          <span className="text-sm font-medium text-slate-900">${item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handleConfirmData}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm & Save
                  </Button>
                  <Button 
                    onClick={() => setExtractedData(null)}
                    variant="outline"
                    className="gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Edit Manually
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
