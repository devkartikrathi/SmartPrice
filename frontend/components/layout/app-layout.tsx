"use client";

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Header } from './header';
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
    const check = async () => {
      if (!isLoaded || !user) return;
      try {
        const res = await fetch('/api/onboarding', { method: 'GET' });
        if (!res.ok) throw new Error('onboarding status failed');
        const data = await res.json();
        setShowOnboarding(!data?.isOnboarded);
      } catch {
        // Fallback to local storage if API fails
        const ls = localStorage.getItem(`onboarding_${user.id}`);
        setShowOnboarding(!ls);
      }
    };
    check();
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
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      {user && <ShoppingCart open={cartOpen} onOpenChange={setCartOpen} />}
    </div>
  );
}
