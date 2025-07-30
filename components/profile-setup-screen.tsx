import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/simple-select';
import { User, Briefcase, MapPin, FileText, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { upsertUserProfile } from '@/lib/database/profiles';
import { PlaidLinkScreen } from './plaid-link-screen';

interface UserProfile {
  email: string;
  name: string;
  profession: string;
  income: string;
  state: string;
  filingStatus: string;
  plaidToken?: string;
}

interface ProfileSetupScreenProps {
  user: any;
  onBack: () => void;
  onComplete: (profile: UserProfile) => void;
}

const professions = [
  'Software Developer', 'Freelance Writer', 'Graphic Designer', 'Consultant', 'Marketing Specialist',
  'Real Estate Agent', 'Photographer', 'Web Designer', 'Content Creator', 'Business Coach',
  'Virtual Assistant', 'Social Media Manager', 'Online Tutor', 'E-commerce Store Owner', 'Other'
];

const incomeRanges = [
  'Under $25,000', '$25,000 - $50,000', '$50,000 - $75,000', '$75,000 - $100,000',
  '$100,000 - $150,000', '$150,000 - $200,000', '$200,000 - $300,000', 'Over $300,000'
];

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const filingStatuses = [
  'Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household', 'Qualifying Widower'
];

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ user, onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'profile' | 'plaid'>('profile');
  const [formData, setFormData] = useState<UserProfile>({
    email: user?.email || '',
    name: user?.user_metadata?.name || '',
    profession: '',
    income: '',
    state: '',
    filingStatus: '',
    plaidToken: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  const isFormValid = formData.email && formData.name && formData.profession && 
                    formData.income && formData.state && formData.filingStatus;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Save profile to Supabase using the database service
      const { data, error: profileError } = await upsertUserProfile({
        user_id: user.id,
        email: formData.email,
        name: formData.name,
        profession: formData.profession,
        income: formData.income,
        state: formData.state,
        filing_status: formData.filingStatus,
        plaid_token: formData.plaidToken
      });

      if (profileError) {
        console.error('Profile save error details:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        });
        throw new Error(profileError.message || 'Failed to save profile');
      }

      console.log('Profile saved successfully:', data);
      // Move to Plaid connection step
      setCurrentStep('plaid');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      
      // Run database test to help diagnose the issue
      try {
        const response = await fetch('/api/test-db');
        const testResult = await response.json();
        console.log('Database test result:', testResult);
      } catch (testError) {
        console.error('Database test failed:', testError);
      }
      
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlaidSuccess = () => {
    // Complete the entire onboarding flow
    onComplete(formData);
  };

  const handlePlaidBack = () => {
    setCurrentStep('profile');
  };

  const handleCreateTable = async () => {
    setIsCreatingTable(true);
    try {
      const response = await fetch('/api/create-table', { method: 'POST' });
      const result = await response.json();
      console.log('Table creation result:', result);
      
      if (result.success || result.tableTest?.works) {
        setError(null);
        alert('Database table created successfully! Please try saving your profile again.');
      } else {
        setError(`Failed to create database table: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error creating table:', err);
      setError(`Failed to create database table: ${err.message}`);
    } finally {
      setIsCreatingTable(false);
    }
  };

  // Show Plaid Link screen if profile is complete
  if (currentStep === 'plaid') {
    return (
      <PlaidLinkScreen
        user={user}
        onSuccess={handlePlaidSuccess}
        onBack={handlePlaidBack}
      />
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
            <h1 className="text-xl font-semibold text-slate-900 mb-1">Complete Your <span className="text-blue-600 font-bold">Profile</span></h1>
            <p className="text-sm text-slate-600">Help us personalize your <span className="font-semibold text-blue-600">tax experience</span></p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 pb-32">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">1</div>
            <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">2</div>
            <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">3</div>
          </div>
          <p className="text-center text-slate-600">
            <span className="font-semibold text-blue-600">Step 1 of 3:</span> Personal Information
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
            <p className="text-red-800 text-sm">{error}</p>
            {error.includes('Failed to save profile') && (
              <div className="pt-2 border-t border-red-200">
                <p className="text-red-700 text-xs mb-2">
                  This might be a database setup issue. Try creating the required table:
                </p>
                <Button
                  onClick={handleCreateTable}
                  disabled={isCreatingTable}
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  {isCreatingTable ? 'Creating Table...' : 'Setup Database Table'}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          <Card className="p-8 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Basic <span className="text-blue-600 font-bold">Information</span></h3>
                <p className="text-slate-600">Your personal details for account setup</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                  className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Professional <span className="text-emerald-600 font-bold">Details</span></h3>
                <p className="text-slate-600">Information about your work and income</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  Profession
                </label>
                <Select value={formData.profession} onValueChange={(value: string) => setFormData(prev => ({ ...prev, profession: value }))}>
                  <SelectTrigger className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-emerald-500 bg-white">
                    <SelectValue placeholder="Select your profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((profession) => (
                      <SelectItem key={profession} value={profession}>
                        {profession}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Annual Income Range
                </label>
                <Select value={formData.income} onValueChange={(value: string) => setFormData(prev => ({ ...prev, income: value }))}>
                  <SelectTrigger className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-emerald-500 bg-white">
                    <SelectValue placeholder="Select your income range" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white border-0 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Tax <span className="text-purple-600 font-bold">Information</span></h3>
                <p className="text-slate-600">Details for accurate tax calculations</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  State of Residence
                </label>
                <Select value={formData.state} onValueChange={(value: string) => setFormData(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-purple-500 bg-white">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {usStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Filing Status
                </label>
                <Select value={formData.filingStatus} onValueChange={(value: string) => setFormData(prev => ({ ...prev, filingStatus: value }))}>
                  <SelectTrigger className="h-12 text-base rounded-2xl border-2 border-slate-200 focus:border-purple-500 bg-white">
                    <SelectValue placeholder="Select your filing status" />
                  </SelectTrigger>
                  <SelectContent>
                    {filingStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-8">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-3xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 text-lg font-semibold"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                <span>Setting up your profile...</span>
              </>
            ) : (
              <>
                <span>Continue to Bank Connection</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
