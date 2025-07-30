"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onBack, 
  onLogin, 
  onSignUp, 
  onForgotPassword 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (email && password) {
      setIsLoading(true);
      await onLogin(email, password);
      setIsLoading(false);
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
              Welcome <span className="text-blue-600 font-bold">Back</span>
            </h1>
            <p className="text-sm text-slate-600">Sign in to your account</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Card className="p-8 bg-white border-0 shadow-xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-slate-600">Enter your credentials to continue</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 rounded-xl border-2 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!email || !password || isLoading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-300 shadow-lg text-base font-semibold"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center space-y-4">
              <button
                onClick={onForgotPassword}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Forgot your password?
              </button>
              
              <div className="text-slate-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={onSignUp}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up here
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
