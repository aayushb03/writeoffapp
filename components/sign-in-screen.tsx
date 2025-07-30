"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, MapPin, Briefcase, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/simple-select';

interface SignInScreenProps {
  user: any;
  onBack: () => void;
  onSave: (userData: any) => void;
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

export const SignInScreen: React.FC<SignInScreenProps> = ({ user, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profession: '',
    income: '',
    state: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  const isFormValid = formData.name && formData.email && formData.profession && 
                     formData.income && formData.state;

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
              Complete Your <span className="text-blue-600 font-bold">Profile</span>
            </h1>
            <p className="text-sm text-slate-600">Update your information for better tax insights</p>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="p-6 pb-32">
        {/* Personal Information */}
        <Card className="p-8 bg-white border-0 shadow-xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Personal <span className="text-blue-600 font-bold">Information</span>
              </h3>
              <p className="text-slate-600">Your basic details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                State
              </label>
              <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                <SelectTrigger className="h-12 rounded-xl border-2">
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
          </div>
        </Card>

        {/* Professional Information */}
        <Card className="p-8 bg-white border-0 shadow-xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Professional <span className="text-emerald-600 font-bold">Details</span>
              </h3>
              <p className="text-slate-600">Your work and income information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Profession
              </label>
              <Select value={formData.profession} onValueChange={(value) => handleInputChange('profession', value)}>
                <SelectTrigger className="h-12 rounded-xl border-2">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Annual Income Range
              </label>
              <Select value={formData.income} onValueChange={(value) => handleInputChange('income', value)}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="Select income range" />
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

        {/* Address Information */}
        <Card className="p-8 bg-white border-0 shadow-xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Address <span className="text-purple-600 font-bold">Information</span>
              </h3>
              <p className="text-slate-600">Optional - helps with local tax rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Street Address
              </label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your street address"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                City
              </label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter your city"
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ZIP Code
              </label>
              <Input
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="Enter your ZIP code"
                className="h-12 rounded-xl border-2"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!isFormValid || isLoading}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-300 shadow-lg text-base font-semibold"
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};
