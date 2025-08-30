"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, User, Settings, Edit, Trash2, Plus } from 'lucide-react';
import { CreditCardForm } from '@/components/onboarding/credit-card-form';
import { useAppStore } from '@/lib/store';

interface CreditCardData {
  id: string;
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

interface OnboardingData {
  occupation: string;
  industry: string;
  companySize: string;
  monthlyIncome: string;
  monthlySpending: string;
  primarySpendingCategory: string;
  secondarySpendingCategory: string;
  shoppingFrequency: string;
  preferredPlatforms: string[];
  travelFrequency: string;
  groceryFrequency: string;
  creditScore: string;
  investmentExperience: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { preferredCreditCard, setPreferredCreditCard } = useAppStore();
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // TODO: Fetch from API
    setCreditCards([
      {
        id: '1',
        cardName: 'HDFC Bank Millennia',
        cardType: 'credit',
        bankName: 'HDFC Bank',
        cardNumber: '1234',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        annualFee: 0,
        interestRate: 3.49,
        creditLimit: 100000,
        rewardsProgram: 'cashback',
        cashbackRate: 5,
        foreignTransactionFee: 0,
      },
      {
        id: '2',
        cardName: 'SBI SimplyCLICK',
        cardType: 'credit',
        bankName: 'State Bank of India',
        cardNumber: '5678',
        expiryMonth: 6,
        expiryYear: 2026,
        isDefault: false,
        annualFee: 999,
        interestRate: 3.99,
        creditLimit: 50000,
        rewardsProgram: 'cashback',
        cashbackRate: 10,
        foreignTransactionFee: 0,
      },
    ]);

    setOnboardingData({
      occupation: 'Employee',
      industry: 'Technology',
      companySize: '51-200',
      monthlyIncome: '50k-100k',
      monthlySpending: '25k-50k',
      primarySpendingCategory: 'shopping',
      secondarySpendingCategory: 'food',
      shoppingFrequency: 'Weekly',
      preferredPlatforms: ['Amazon', 'Flipkart', 'Myntra'],
      travelFrequency: 'Quarterly',
      groceryFrequency: 'Weekly',
      creditScore: 'Good (700-749)',
      investmentExperience: 'Intermediate',
    });
  }, []);

  const handleAddCard = (cardData: any) => {
    const newCard: CreditCardData = {
      ...cardData,
      id: Date.now().toString(),
    };
    setCreditCards(prev => [...prev, newCard]);
    setShowAddCard(false);
  };

  const handleEditCard = (card: CreditCardData) => {
    setEditingCard(card);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      setCreditCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  const handleSetDefaultCard = (cardId: string) => {
    setCreditCards(prev => 
      prev.map(card => ({
        ...card,
        isDefault: card.id === cardId
      }))
    );
    
    const card = creditCards.find(c => c.id === cardId);
    if (card) {
      setPreferredCreditCard(card.cardName);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account preferences, credit cards, and personal information
          </p>
        </div>

        <Tabs defaultValue="credit-cards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credit-cards" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Credit Cards</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credit-cards" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Credit Cards</CardTitle>
                  <Button onClick={() => setShowAddCard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {creditCards.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No credit cards added yet</p>
                    <Button onClick={() => setShowAddCard(true)} className="mt-4">
                      Add Your First Card
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-md flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{card.cardName}</h4>
                            <p className="text-sm text-muted-foreground">{card.bankName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {card.cardType}
                              </Badge>
                              {card.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  Default
                                </Badge>
                              )}
                              {card.rewardsProgram !== 'none' && (
                                <Badge variant="outline" className="text-xs">
                                  {card.rewardsProgram}
                                </Badge>
                              )}
                              {card.cashbackRate > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {card.cashbackRate}% cashback
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!card.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultCard(card.id)}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCard(card)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showAddCard && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Credit Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreditCardForm onAdd={handleAddCard} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                {onboardingData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Occupation:</span> {onboardingData.occupation}</p>
                        <p><span className="text-muted-foreground">Industry:</span> {onboardingData.industry}</p>
                        <p><span className="text-muted-foreground">Company Size:</span> {onboardingData.companySize}</p>
                        <p><span className="text-muted-foreground">Monthly Income:</span> ₹{onboardingData.monthlyIncome}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Spending Patterns</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Monthly Spending:</span> ₹{onboardingData.monthlySpending}</p>
                        <p><span className="text-muted-foreground">Primary Category:</span> {onboardingData.primarySpendingCategory}</p>
                        <p><span className="text-muted-foreground">Shopping Frequency:</span> {onboardingData.shoppingFrequency}</p>
                        <p><span className="text-muted-foreground">Travel Frequency:</span> {onboardingData.travelFrequency}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Preferences</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Platforms:</span> {onboardingData.preferredPlatforms.join(', ')}</p>
                        <p><span className="text-muted-foreground">Credit Score:</span> {onboardingData.creditScore}</p>
                        <p><span className="text-muted-foreground">Investment Experience:</span> {onboardingData.investmentExperience}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Current Default Card</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Default Card:</span> {preferredCreditCard || 'None set'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No profile information available</p>
                    <Button className="mt-4">
                      Complete Onboarding
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Default Credit Card</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      This card will be used as the default for recommendations and deals
                    </p>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">
                        Current: <span className="font-medium">{preferredCreditCard || 'None set'}</span>
                      </span>
                      {preferredCreditCard && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreferredCreditCard(null)}
                        >
                          Clear Default
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Notifications</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose what notifications you want to receive
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Deal alerts for your preferred categories</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Credit card recommendations</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Spending insights and reports</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Marketing and promotional offers</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
