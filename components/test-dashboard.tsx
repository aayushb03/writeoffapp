"use client";

import React from 'react';
import { DashboardScreen } from './dashboard-screen';

// Test component to verify Plaid integration
export const TestDashboard: React.FC = () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User'
    }
  };

  const handleSignOut = () => {
    console.log('Sign out clicked');
  };

  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
  };

  return (
    <DashboardScreen 
      user={mockUser}
      onSignOut={handleSignOut}
      onNavigate={handleNavigate}
    />
  );
};
