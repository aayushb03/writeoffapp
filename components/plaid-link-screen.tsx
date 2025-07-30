"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, ArrowLeft, Shield, Building2 } from 'lucide-react';

interface PlaidLinkScreenProps {
  user: any;
  onSuccess: () => void;
  onBack: () => void;
}

export const PlaidLinkScreen: React.FC<PlaidLinkScreenProps> = ({ user, onSuccess, onBack }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create link token on component mount
  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to create link token');
        }

        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (err: any) {
        console.error('Error creating link token:', err);
        setError('Failed to initialize bank connection. Please try again.');
      }
    };

    createLinkToken();
  }, [user.id]);

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect bank account');
      }

      const data = await response.json();
      console.log('Bank account connected successfully:', data);
      setIsConnected(true);
      
      // Show success message for a moment, then call onSuccess
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Error connecting bank account:', err);
      setError('Failed to connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.id, onSuccess]);

  const onPlaidExit = useCallback((err: any) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      setError('Bank connection was cancelled or failed. Please try again.');
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  });

  const handleConnectBank = () => {
    if (ready) {
      open();
    }
  };

  const handleSkip = () => {
    onSuccess(); // Continue to next step without connecting bank
  };

  if (isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="p-8 bg-white border-0 shadow-2xl max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Bank Connected!</h2>
            <p className="text-slate-600">Your bank account has been successfully connected.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Connect Your <span className="text-emerald-600 font-bold">Bank</span></h1>
            <p className="text-sm text-slate-600">Securely link your accounts for <span className="font-semibold text-emerald-600">expense tracking</span></p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 pb-32">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">✓</div>
            <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">2</div>
            <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">3</div>
          </div>
          <p className="text-center text-slate-600">
            <span className="font-semibold text-emerald-600">Step 2 of 3:</span> Bank Connection
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <Card className="p-8 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Connect Your <span className="text-emerald-600 font-bold">Bank Account</span></h3>
                <p className="text-slate-600">Automatically track business expenses and transactions</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Bank-level security</p>
                  <p className="text-xs text-slate-600">256-bit encryption and read-only access</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Automatic categorization</p>
                  <p className="text-xs text-slate-600">AI-powered expense detection and sorting</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Tax optimization</p>
                  <p className="text-xs text-slate-600">Maximize deductions and save money</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleConnectBank}
                disabled={!ready || loading}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    <span>Connect Bank Account</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full h-12 bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-slate-300 rounded-2xl transition-all duration-200 text-sm font-medium"
              >
                Skip for now (connect later)
              </Button>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              By connecting your bank account, you agree to Plaid's Privacy Policy and Terms of Service. 
              WriteOff uses bank-level security and never stores your banking credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
