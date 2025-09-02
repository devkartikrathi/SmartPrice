"use client";

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

interface Props {
  onComplete?: () => void;
}

const CREDIT_CARD_OPTIONS: string[] = [
  'HDFC Bank Millennia',
  'HDFC Bank Regalia',
  'ICICI Bank Amazon Pay',
  'Axis Bank Flipkart',
  'SBI SimplyCLICK',
  'SBI SimplySAVE',
  'Amex Membership Rewards',
];

export function OnboardingWizard({ onComplete }: Props) {
  const { user } = useUser();
  const { preferredCreditCard, setPreferredCreditCard, selectedCreditCards, setSelectedCreditCards } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Form state (Step 1)
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [monthlySpending, setMonthlySpending] = useState<string>('0-10k');
  const [shoppingFrequency, setShoppingFrequency] = useState<string>('weekly');
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>([]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/onboarding', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to check onboarding');
        const data = await res.json();
        setIsOnboarded(!!data.isOnboarded);
        if (data.onboarding) {
          const ob = data.onboarding;
          setOccupation(ob.occupation ?? '');
          setShoppingFrequency(ob.shoppingFrequency ?? 'weekly');
          setPreferredPlatforms(Array.isArray(ob.preferredPlatforms) ? ob.preferredPlatforms : []);
          setMonthlySpending(ob.monthlySpending ?? '0-10k');
        }
      } catch (e: any) {
        setError(e.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const canContinueStep1 = useMemo(() => {
    return Boolean((firstName || user?.firstName) && (email || user?.primaryEmailAddress?.emailAddress));
  }, [firstName, email, user?.firstName, user?.primaryEmailAddress?.emailAddress]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        firstName: firstName || user?.firstName || '',
        lastName: lastName || user?.lastName || '',
        email: email || user?.primaryEmailAddress?.emailAddress || '',
        occupation,
        monthlySpending,
        shoppingFrequency,
        preferredPlatforms,
        selectedCardIds: selectedCreditCards,
      };
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save onboarding');
      // Set primary card locally
      if (selectedCreditCards.length > 0 && !preferredCreditCard) {
        setPreferredCreditCard(selectedCreditCards[0]);
      }
      setIsOnboarded(true);
      if (onComplete) onComplete();
    } catch (e: any) {
      setError(e.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // If already onboarded, render nothing
  if (!loading && isOnboarded) return null;

        return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Quick Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={user?.firstName || 'John'} />
            </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={user?.lastName || 'Doe'} />
              </div>
            </div>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={user?.primaryEmailAddress?.emailAddress || 'you@example.com'} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Occupation</Label>
                  <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Software Engineer" />
              </div>
                <div>
                  <Label>Monthly Spending</Label>
                  <Input value={monthlySpending} onChange={(e) => setMonthlySpending(e.target.value)} placeholder="0-10k" />
            </div>
                <div>
                  <Label>Shopping Frequency</Label>
                  <Input value={shoppingFrequency} onChange={(e) => setShoppingFrequency(e.target.value)} placeholder="weekly" />
            </div>
          </div>
              <div>
                <Label>Preferred Platforms (comma separated)</Label>
                <Input
                  value={preferredPlatforms.join(', ')}
                  onChange={(e) => setPreferredPlatforms(
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )}
                  placeholder="Amazon, Flipkart"
                />
                  </div>
              <div className="flex justify-end">
                <Button disabled={!canContinueStep1 || loading} onClick={() => setStep(2)}>Next</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Select Your Credit Cards</Label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CREDIT_CARD_OPTIONS.map((name) => (
                    <label key={name} className="flex items-center gap-2 p-2 border rounded">
                    <Checkbox
                        checked={selectedCreditCards.includes(name)}
                      onCheckedChange={(checked) => {
                          if (checked) setSelectedCreditCards([...selectedCreditCards, name]);
                          else setSelectedCreditCards(selectedCreditCards.filter((n) => n !== name));
                        }}
                      />
                      <span>{name}</span>
                      {preferredCreditCard === name && (
                        <Badge variant="secondary" className="ml-auto">Primary</Badge>
                      )}
                    </label>
                ))}
              </div>
            </div>
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <div className="flex items-center gap-2">
                  {selectedCreditCards.length > 0 && (
                    <Button variant="outline" onClick={() => setPreferredCreditCard(selectedCreditCards[0])}>Set Primary</Button>
                  )}
                  <Button disabled={loading} onClick={handleSubmit}>Finish</Button>
              </div>
            </div>
          </div>
          )}
            </CardContent>
          </Card>
    </div>
  );
}
