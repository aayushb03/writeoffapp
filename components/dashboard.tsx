"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  CreditCard, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText,
  Settings,
  LogOut,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle to avoid error when no profile exists

        if (error) {
          console.error('Error fetching profile:', {
            message: error.message,
            code: error.code,
            details: error.details
          });
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user.id, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">WriteOff</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Welcome back, <span className="text-blue-600 font-bold">{profile?.name || user.email}</span>
                </h1>
                <p className="text-sm text-slate-600">Ready to track your expenses and maximize deductions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm" 
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Deductions</p>
                <p className="text-2xl font-bold text-slate-900">$0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tracked Expenses</p>
                <p className="text-2xl font-bold text-slate-900">$0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Connected Banks</p>
                <p className="text-2xl font-bold text-slate-900">{profile?.plaid_token ? '1' : '0'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tax Savings</p>
                <p className="text-2xl font-bold text-slate-900">$0</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 bg-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
                  <p className="text-slate-600">Get started with tracking your business expenses</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  className="h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg justify-start gap-4 px-6"
                >
                  <PlusCircle className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Add Expense</p>
                    <p className="text-xs text-emerald-100">Manual entry</p>
                  </div>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl justify-start gap-4 px-6"
                >
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Connect Bank</p>
                    <p className="text-xs text-slate-600">Auto tracking</p>
                  </div>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl justify-start gap-4 px-6"
                >
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Upload Receipt</p>
                    <p className="text-xs text-slate-600">Scan & categorize</p>
                  </div>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl justify-start gap-4 px-6"
                >
                  <Calendar className="w-6 h-6 text-orange-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Tax Calendar</p>
                    <p className="text-xs text-slate-600">Important dates</p>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Recent Activity</h3>
                  <p className="text-slate-600">Your latest expense tracking activity</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No activity yet</p>
                <p className="text-sm text-slate-500">Start by adding your first expense or connecting a bank account</p>
              </div>
            </Card>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-0 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{profile?.name || 'User'}</h3>
                <p className="text-sm text-slate-600">{profile?.profession || 'Professional'}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Income Range</span>
                  <span className="text-sm font-medium text-slate-900">{profile?.income}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">State</span>
                  <span className="text-sm font-medium text-slate-900">{profile?.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Filing Status</span>
                  <span className="text-sm font-medium text-slate-900">{profile?.filing_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Bank Connected</span>
                  <span className={`text-sm font-medium ${profile?.plaid_token ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {profile?.plaid_token ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Tax Tips */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">💡 Tax Tip</h3>
                <p className="text-sm text-blue-100">
                  Track your home office expenses! If you work from home, you may be able to deduct a portion of your rent, utilities, and office supplies.
                </p>
              </div>
              <Button size="sm" variant="secondary" className="w-full">
                Learn More
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
