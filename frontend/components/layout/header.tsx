"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CreditCardSelector } from '@/components/ui/credit-card-selector';
import { Badge } from '@/components/ui/badge';
import { HealthStatus } from '@/components/ui/health-status';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { isSignedIn, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems, setCartOpen, getCartItemCount } = useAppStore();
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  // Lightweight health ping for navbar dot
  useEffect(() => {
    const check = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${base}/health`, { cache: 'no-store' });
        setBackendUp(res.ok);
      } catch {
        setBackendUp(false);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const cartItemCount = getCartItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2"
          >
            <span className="text-xl font-bold">SmartPrice</span>
          </motion.div>
        </Link>

        {/* Desktop Navigation - Only essential elements */}
        <nav className="hidden md:flex items-center space-x-4">
          {isSignedIn && (
            <>
              {/* Minimal backend status dot */}
              <div className="hidden sm:flex items-center" title={backendUp == null ? 'Checking backend…' : backendUp ? 'Backend: Healthy' : 'Backend: Down'}>
                <span className={`h-2.5 w-2.5 rounded-full ${backendUp == null ? 'bg-gray-400 animate-pulse' : backendUp ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
              </div>

              {/* Credit card multi-select */}
              <CreditCardSelector />

              {/* Shopping Cart */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </>
          )}
          
          <ThemeToggle />

          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <div className="flex items-center space-x-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Get Started</Button>
              </SignUpButton>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          {isSignedIn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu - Simplified */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background/95 backdrop-blur"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {isSignedIn ? (
                <>
                  {/* Health Status in Mobile Menu */}
                  <div className="pt-4 border-t">
                    <HealthStatus />
                  </div>
                  
                  {/* User Button */}
                  <div className="pt-4 border-t">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <SignInButton mode="modal">
                    <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="w-full">Get Started</Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
