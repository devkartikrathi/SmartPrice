"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const CREDIT_CARDS = [
  // HDFC
  'HDFC Bank Millennia',
  'HDFC Bank Regalia Gold',
  'HDFC Bank Diners Club Black',
  'IndianOil HDFC Bank',
  // SBI
  'SBI Card SimplyCLICK',
  'SBI Card SimplySAVE',
  'SBI Card ELITE',
  'BPCL SBI Card OCTANE',
  // ICICI
  'Amazon Pay ICICI Bank',
  'ICICI Bank Coral',
  'ICICI Bank Sapphiro',
  // Axis
  'Axis Bank ACE',
  'Flipkart Axis Bank',
  'Axis Bank Magnus',
  // American Express
  'American Express Membership Rewards®',
  'American Express Platinum Travel',
  // Emirates NBD
  'Emirates NBD Skywards Signature',
  'Emirates NBD dnata World',
  // FAB
  'First Abu Dhabi Bank (FAB) Cashback Card',
  'First Abu Dhabi Bank (FAB) Etihad Guest Platinum',
  // ADCB
  'ADCB Talabat ADCB',
  'ADCB Lulu Platinum',
  // Dubai Islamic Bank
  'Dubai Islamic Bank Prime Infinite',
  'Dubai Islamic Bank Al Islami Platinum Charge',
];

export function CreditCardSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { preferredCreditCard, setPreferredCreditCard, selectedCreditCards, setSelectedCreditCards } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/user/credit-cards', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load credit cards');
        const data = await res.json();
        if (Array.isArray(data.selected)) {
          setSelectedCreditCards(data.selected);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load cards');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleCard = (card: string, checked: boolean) => {
    if (checked) {
      if (!selectedCreditCards.includes(card)) setSelectedCreditCards([...selectedCreditCards, card]);
    } else {
      setSelectedCreditCards(selectedCreditCards.filter(c => c !== card));
    }
  };

  const updateSelection = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: selectedCreditCards }),
      });
      if (!res.ok) throw new Error('Failed to update cards');
      setIsOpen(false);
    } catch (e) {
      // noop minimal
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCard = () => {
          setPreferredCreditCard(undefined);
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
        <div className="absolute top-full mt-2 right-0 w-72 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b">
            <h4 className="text-sm font-medium">Select Credit Card</h4>
            <p className="text-xs text-muted-foreground">
              Choose your preferred card for better deals and cashback
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {loading && <div className="text-xs text-muted-foreground px-2">Loading...</div>}
            {error && <div className="text-xs text-red-500 px-2">{error}</div>}
            {!loading && CREDIT_CARDS.map((card) => (
              <label key={card} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-muted rounded">
                <input
                  type="checkbox"
                  checked={selectedCreditCards.includes(card)}
                  onChange={(e) => toggleCard(card, e.target.checked)}
                />
                <span className="flex-1">{card}</span>
              </label>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleRemoveCard}>
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={updateSelection} disabled={loading}>
              Update
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
