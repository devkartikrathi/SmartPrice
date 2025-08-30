"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const CREDIT_CARDS = [
  'HDFC Bank Millennia',
  'HDFC Bank Regalia',
  'SBI SimplyCLICK',
  'ICICI Bank Amazon Pay',
  'Axis Bank Flipkart',
  'Citi Bank Rewards',
  'American Express Platinum',
  'No Credit Card',
];

export function CreditCardSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { preferredCreditCard, setPreferredCreditCard } = useAppStore();

  const handleCardSelect = (card: string) => {
    setPreferredCreditCard(card);
    setIsOpen(false);
  };

  const handleRemoveCard = () => {
    setPreferredCreditCard(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <CreditCard className="h-4 w-4" />
        <span className="text-sm">
          {preferredCreditCard || 'Select Credit Card'}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b">
            <h4 className="text-sm font-medium">Select Credit Card</h4>
            <p className="text-xs text-muted-foreground">
              Choose your preferred card for better deals and cashback
            </p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {CREDIT_CARDS.map((card) => (
              <button
                key={card}
                onClick={() => handleCardSelect(card)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  preferredCreditCard === card ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{card}</span>
                  {preferredCreditCard === card && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {preferredCreditCard && (
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveCard}
                className="w-full"
              >
                Remove Selection
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
