"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUserProfile, upsertUserProfile } from '@/lib/database/profiles';

interface DebugProfileProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
}

export const DebugProfile: React.FC<DebugProfileProps> = ({ user }) => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testGetProfile = async () => {
    setIsLoading(true);
    try {
      console.log('Testing getUserProfile with user:', user);
      const { data, error } = await getUserProfile(user.id);
      
      const result = {
        timestamp: new Date().toISOString(),
        operation: 'getUserProfile',
        userId: user.id,
        data,
        error: error ? {
          message: (error as any)?.message,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          fullError: error
        } : null
      };
      
      setDebugInfo(JSON.stringify(result, null, 2));
      console.log('getUserProfile result:', result);
    } catch (err) {
      const result = {
        timestamp: new Date().toISOString(),
        operation: 'getUserProfile',
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
        fullError: err
      };
      setDebugInfo(JSON.stringify(result, null, 2));
      console.error('getUserProfile error:', result);
    } finally {
      setIsLoading(false);
    }
  };

  const testUpsertProfile = async () => {
    setIsLoading(true);
    try {
      const testProfile = {
        user_id: user.id,
        email: user.email || 'test@example.com',
        name: user.user_metadata?.name || 'Test User',
        profession: 'Software Engineer',
        income: '50k_75k',
        state: 'CA',
        filing_status: 'single'
      };

      console.log('Testing upsertUserProfile with profile:', testProfile);
      const { data, error } = await upsertUserProfile(testProfile);
      
      const result = {
        timestamp: new Date().toISOString(),
        operation: 'upsertUserProfile',
        profileData: testProfile,
        data,
        error: error ? {
          message: (error as any)?.message,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          fullError: error
        } : null
      };
      
      setDebugInfo(JSON.stringify(result, null, 2));
      console.log('upsertUserProfile result:', result);
    } catch (err) {
      const result = {
        timestamp: new Date().toISOString(),
        operation: 'upsertUserProfile',
        error: err instanceof Error ? err.message : String(err),
        fullError: err
      };
      setDebugInfo(JSON.stringify(result, null, 2));
      console.error('upsertUserProfile error:', result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 m-6">
      <h3 className="text-lg font-semibold mb-4">Profile Database Debug</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">User Info:</h4>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({ id: user.id, email: user.email, metadata: user.user_metadata }, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <Button onClick={testGetProfile} disabled={isLoading}>
            Test Get Profile
          </Button>
          <Button onClick={testUpsertProfile} disabled={isLoading}>
            Test Upsert Profile
          </Button>
        </div>

        {debugInfo && (
          <div>
            <h4 className="font-medium mb-2">Debug Result:</h4>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {debugInfo}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};
