"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, X } from 'lucide-react';

interface CreditCardData {
  cardName: string;
  cardType: string;
  bankName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  annualFee: number;
  interestRate: number;
  creditLimit: number;
  rewardsProgram: string;
  cashbackRate: number;
  foreignTransactionFee: number;
}

interface CreditCardFormProps {
  onAdd: (card: CreditCardData) => void;
}

const CARD_TYPES = ['credit', 'debit', 'prepaid'];
const REWARDS_PROGRAMS = ['cashback', 'points', 'miles', 'none'];

const POPULAR_CARDS = [
  { name: 'HDFC Bank Millennia', bank: 'HDFC Bank', type: 'credit', rewards: 'cashback', cashback: 5 },
  { name: 'HDFC Bank Regalia', bank: 'HDFC Bank', type: 'credit', rewards: 'points', cashback: 0 },
  { name: 'SBI SimplyCLICK', bank: 'State Bank of India', type: 'credit', rewards: 'cashback', cashback: 10 },
  { name: 'ICICI Bank Amazon Pay', bank: 'ICICI Bank', type: 'credit', rewards: 'cashback', cashback: 5 },
  { name: 'Axis Bank Flipkart', bank: 'Axis Bank', type: 'credit', rewards: 'cashback', cashback: 5 },
  { name: 'Citi Bank Rewards', bank: 'Citibank', type: 'credit', rewards: 'points', cashback: 0 },
  { name: 'American Express Platinum', bank: 'American Express', type: 'credit', rewards: 'miles', cashback: 0 },
];

export function CreditCardForm({ onAdd }: CreditCardFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPopularCard, setSelectedPopularCard] = useState<string>('');
  const [formData, setFormData] = useState<CreditCardData>({
    cardName: '',
    cardType: 'credit',
    bankName: '',
    cardNumber: '',
    expiryMonth: 0,
    expiryYear: 0,
    isDefault: false,
    annualFee: 0,
    interestRate: 0,
    creditLimit: 0,
    rewardsProgram: 'cashback',
    cashbackRate: 0,
    foreignTransactionFee: 0,
  });

  const handlePopularCardSelect = (cardName: string) => {
    const card = POPULAR_CARDS.find(c => c.name === cardName);
    if (card) {
      setFormData({
        ...formData,
        cardName: card.name,
        bankName: card.bank,
        cardType: card.type,
        rewardsProgram: card.rewards,
        cashbackRate: card.cashback,
      });
      setShowForm(true);
    }
  };

  const handleInputChange = (field: keyof CreditCardData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.cardName || !formData.bankName || !formData.cardNumber) {
      alert('Please fill in all required fields');
      return;
    }

    // Add the card
    onAdd(formData);
    
    // Reset form
    setFormData({
      cardName: '',
      cardType: 'credit',
      bankName: '',
      cardNumber: '',
      expiryMonth: 0,
      expiryYear: 0,
      isDefault: false,
      annualFee: 0,
      interestRate: 0,
      creditLimit: 0,
      rewardsProgram: 'cashback',
      cashbackRate: 0,
      foreignTransactionFee: 0,
    });
    setShowForm(false);
    setSelectedPopularCard('');
  };

  const generateExpiryYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 20; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  const generateExpiryMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  return (
    <div className="space-y-6">
      {/* Popular Cards Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Quick Add Popular Cards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POPULAR_CARDS.map((card) => (
            <Button
              key={card.name}
              variant="outline"
              onClick={() => handlePopularCardSelect(card.name)}
              className="justify-start h-auto p-3"
            >
              <div className="text-left">
                <p className="font-medium">{card.name}</p>
                <p className="text-sm text-muted-foreground">{card.bank}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {card.type}
                  </Badge>
                  {card.rewards !== 'none' && (
                    <Badge variant="outline" className="text-xs">
                      {card.rewards}
                    </Badge>
                  )}
                  {card.cashback > 0 && (
                    <Badge variant="default" className="text-xs">
                      {card.cashback}% cashback
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Add Custom Card Button */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          Add Custom Card
        </Button>
      </div>

      {/* Custom Card Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Add Credit Card</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardName">Card Name *</Label>
                  <Input
                    id="cardName"
                    value={formData.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value)}
                    placeholder="e.g., HDFC Bank Millennia"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="e.g., HDFC Bank"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cardType">Card Type</Label>
                  <Select
                    value={formData.cardType}
                    onValueChange={(value) => handleInputChange('cardType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number (Last 4 digits)</Label>
                  <Input
                    id="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>

                <div>
                  <Label htmlFor="expiryMonth">Expiry Month</Label>
                  <Select
                    value={formData.expiryMonth.toString()}
                    onValueChange={(value) => handleInputChange('expiryMonth', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateExpiryMonths().map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {month.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expiryYear">Expiry Year</Label>
                  <Select
                    value={formData.expiryYear.toString()}
                    onValueChange={(value) => handleInputChange('expiryYear', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateExpiryYears().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rewardsProgram">Rewards Program</Label>
                  <Select
                    value={formData.rewardsProgram}
                    onValueChange={(value) => handleInputChange('rewardsProgram', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REWARDS_PROGRAMS.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program.charAt(0).toUpperCase() + program.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cashbackRate">Cashback Rate (%)</Label>
                  <Input
                    id="cashbackRate"
                    type="number"
                    step="0.1"
                    value={formData.cashbackRate}
                    onChange={(e) => handleInputChange('cashbackRate', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="annualFee">Annual Fee (₹)</Label>
                  <Input
                    id="annualFee"
                    type="number"
                    value={formData.annualFee}
                    onChange={(e) => handleInputChange('annualFee', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isDefault">Set as default card</Label>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Card
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
