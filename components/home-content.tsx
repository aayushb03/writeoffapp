import React from 'react';
import { Button } from '../ui/button';
import writeOffLogo from '@/public/writeofflogo.png';
import Image from 'next/image';
import Link from 'next/link';

export function HomeContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/20"></div>
      
      <div className="relative min-h-screen flex flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo and heading */}
          <div className="text-center space-y-3 mb-6">
            <div className="flex justify-center">
              <Image src={writeOffLogo} alt="WriteOff" className="w-32 h-auto"/>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Welcome to WriteOff
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
                AI-powered tax optimization for modern professionals
              </p>
            </div>
          </div>

          {/* Main content card */}
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-900/5 ring-1 ring-border p-6 space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-card-foreground">Get started</h2>
              <p className="text-xs text-muted-foreground">
                Create an account or sign in to access your personalized dashboard
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link href="/auth/sign-up">
                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl">
                  Create Account
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="w-full h-10 bg-background hover:bg-muted text-foreground border border-border hover:border-primary/30 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="text-center space-y-2 p-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-muted-foreground">AI Analysis</p>
            </div>
            <div className="text-center space-y-2 p-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Bank Sync</p>
            </div>
            <div className="text-center space-y-2 p-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Auto-Detect</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 