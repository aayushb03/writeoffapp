"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserPlus, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

interface SignUpScreenProps {
  onBack: () => void;
  onSignUp: (email: string, password: string, name: string) => void;
  onLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ 
  onBack, 
  onSignUp, 
  onLogin 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = name && email && password && confirmPassword && password === confirmPassword;

  const handleSignUp = async () => {
    if (isFormValid) {
      setIsLoading(true);
      await onSignUp(email, password, name);
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
              Create <span className="text-blue-600 font-bold">Account</span>
            </h1>
            <p className="text-sm text-slate-600">Join thousands saving on taxes</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Card className="p-8 bg-white border-0 shadow-xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Get Started</h2>
            <p className="text-slate-600">Create your WriteOff account today</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 rounded-xl border-2"
              />
            </div>

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
                  placeholder="Create a password"
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="h-12 rounded-xl border-2 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-sm mt-1">Passwords don't match</p>
              )}
            </div>

            <Button
              onClick={handleSignUp}
              disabled={!isFormValid || isLoading}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl transition-all duration-300 shadow-lg text-base font-semibold"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <div className="text-slate-600 text-sm">
                Already have an account?{' '}
                <button
                  onClick={onLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in here
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
