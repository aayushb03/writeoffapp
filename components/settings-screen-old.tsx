"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, User, Bell, Lock, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface SettingsScreenProps {
  user: any;
  onBack: () => void;
  onSignOut: () => void;
}

"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/simple-select';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Briefcase, 
  DollarSign, 
  MapPin, 
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getUserProfile, upsertUserProfile, UserProfile } from '@/lib/database/profiles';

interface SettingsScreenProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  user, 
  onBack, 
  onNavigate 
}) => {
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    profession: '',
    income: '',
    state: '',
    filing_status: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const { data: existingProfile, error } = await getUserProfile(user.id);
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          setErrorMessage('Failed to load profile data');
          return;
        }

        if (existingProfile) {
          setProfile({
            name: existingProfile.name || user?.user_metadata?.name || '',
            email: existingProfile.email || user?.email || '',
            profession: existingProfile.profession || '',
            income: existingProfile.income || '',
            state: existingProfile.state || '',
            filing_status: existingProfile.filing_status || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setErrorMessage('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user.id, user?.user_metadata?.name, user?.email]);

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setErrorMessage('');

      const profileData = {
        user_id: user.id,
        email: profile.email,
        name: profile.name,
        profession: profile.profession,
        income: profile.income,
        state: profile.state,
        filing_status: profile.filing_status
      };

      const { data, error } = await upsertUserProfile(profileData);

      if (error) {
        console.error('Error saving profile:', error);
        setSaveStatus('error');
        setErrorMessage('Failed to save profile. Please try again.');
        return;
      }

      console.log('Profile saved successfully:', data);
      setSaveStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveStatus('error');
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = profile.name && profile.email && profile.profession && profile.income && profile.state && profile.filing_status;

  const incomeOptions = [
    { value: 'under_25k', label: 'Under $25,000' },
    { value: '25k_50k', label: '$25,000 - $50,000' },
    { value: '50k_75k', label: '$50,000 - $75,000' },
    { value: '75k_100k', label: '$75,000 - $100,000' },
    { value: '100k_150k', label: '$100,000 - $150,000' },
    { value: '150k_250k', label: '$150,000 - $250,000' },
    { value: 'over_250k', label: 'Over $250,000' }
  ];

  const stateOptions = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  const filingStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married_jointly', label: 'Married Filing Jointly' },
    { value: 'married_separately', label: 'Married Filing Separately' },
    { value: 'head_of_household', label: 'Head of Household' },
    { value: 'qualifying_widow', label: 'Qualifying Widow(er)' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Loading profile settings...</p>
        </div>
      </div>
    );
  }

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
              <span className="text-blue-600 font-bold">Settings</span>
            </h1>
            <p className="text-sm text-slate-600">Manage your profile and preferences</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Save Status Messages */}
        {saveStatus === 'success' && (
          <Card className="p-4 bg-emerald-50 border-emerald-200 shadow-lg mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-emerald-800 font-medium">Profile Updated Successfully</p>
                <p className="text-emerald-600 text-sm">Your changes have been saved.</p>
              </div>
            </div>
          </Card>
        )}

        {saveStatus === 'error' && (
          <Card className="p-4 bg-red-50 border-red-200 shadow-lg mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Save Failed</p>
                <p className="text-red-600 text-sm">{errorMessage}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Profile Settings Card */}
        <Card className="p-8 bg-white border-0 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Settings</h2>
            <p className="text-slate-600">Update your personal information and tax preferences</p>
          </div>

          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Professional Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profession
                </label>
                <Input
                  type="text"
                  value={profile.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  placeholder="e.g., Software Engineer, Consultant, Freelancer"
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>

            {/* Tax Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Tax Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Annual Income
                  </label>
                  <SimpleSelect
                    value={profile.income}
                    onValueChange={(value) => handleInputChange('income', value)}
                    placeholder="Select income range"
                    options={incomeOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    State
                  </label>
                  <SimpleSelect
                    value={profile.state}
                    onValueChange={(value) => handleInputChange('state', value)}
                    placeholder="Select your state"
                    options={stateOptions}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Filing Status
                  </label>
                  <SimpleSelect
                    value={profile.filing_status}
                    onValueChange={(value) => handleInputChange('filing_status', value)}
                    placeholder="Select filing status"
                    options={filingStatusOptions}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid || isSaving}
                  className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-300 shadow-lg text-base font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  onClick={onBack}
                  variant="outline"
                  className="h-14 px-8 rounded-2xl border-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Settings */}
        <Card className="p-6 bg-white border-0 shadow-xl mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={() => onNavigate('dashboard')}
              variant="outline"
              className="h-12 justify-start gap-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            
            <Button 
              onClick={() => onNavigate('plaid')}
              variant="outline"
              className="h-12 justify-start gap-3"
            >
              <DollarSign className="w-4 h-4" />
              Manage Bank Accounts
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
