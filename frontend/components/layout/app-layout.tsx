"use client";

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Header } from './header';
import { Navigation } from './navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { ShoppingCart } from '@/components/cart/shopping-cart';
import { useAppStore } from '@/lib/store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoaded } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { cartOpen, setCartOpen } = useAppStore();

  useEffect(() => {
    if (isLoaded && user) {
      // TODO: Check if user has completed onboarding from database
      // For now, we'll show onboarding for new users
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user.id}`);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isLoaded, user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'completed');
    }
    setShowOnboarding(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <ShoppingCart open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
