"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Star, TrendingUp, Shield, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface CreditCardRecommendation {
  id: string;
  cardName: string;
  bankName: string;
  cardType: string;
  annualFee: number;
  interestRate: number;
  creditLimit: string;
  rewardsProgram: string;
  cashbackRate: number;
  foreignTransactionFee: number;
  benefits: string[];
  score: number;
  image: string;
}

const mockRecommendations: CreditCardRecommendation[] = [
  {
    id: '1',
    cardName: 'HDFC Bank Millennia',
    bankName: 'HDFC Bank',
    cardType: 'Credit Card',
    annualFee: 0,
    interestRate: 3.49,
    creditLimit: '₹1,00,000 - ₹5,00,000',
    rewardsProgram: 'Cashback',
    cashbackRate: 5,
    foreignTransactionFee: 0,
    benefits: [
      '5% cashback on Amazon, Flipkart, Myntra',
      '1% cashback on all other spends',
      'No annual fee',
      'Welcome benefits worth ₹2,000',
      'Fuel surcharge waiver'
    ],
    score: 9.2,
    image: '/api/placeholder/300/200'
  },
  {
    id: '2',
    cardName: 'SBI SimplyCLICK',
    bankName: 'State Bank of India',
    cardType: 'Credit Card',
    annualFee: 999,
    interestRate: 3.99,
    creditLimit: '₹50,000 - ₹2,00,000',
    rewardsProgram: 'Cashback',
    cashbackRate: 10,
    foreignTransactionFee: 0,
    benefits: [
      '10% cashback on online shopping',
      '5% cashback on dining',
      '2% cashback on fuel',
      '1% cashback on all other spends',
      'Movie ticket discounts'
    ],
    score: 8.8,
    image: '/api/placeholder/300/200'
  },
  {
    id: '3',
    cardName: 'ICICI Amazon Pay',
    bankName: 'ICICI Bank',
    cardType: 'Credit Card',
    annualFee: 0,
    interestRate: 3.99,
    creditLimit: '₹50,000 - ₹3,00,000',
    rewardsProgram: 'Cashback',
    cashbackRate: 5,
    foreignTransactionFee: 0,
    benefits: [
      '5% cashback on Amazon',
      '2% cashback on all spends',
      'No annual fee',
      'Amazon Prime membership',
      'Fuel surcharge waiver'
    ],
    score: 8.5,
    image: '/api/placeholder/300/200'
  }
];

export default function CardsPage() {
  const { user } = useUser();
  const { preferredCreditCard } = useAppStore();
  const [recommendations, setRecommendations] = useState<CreditCardRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch from API based on user preferences
    setRecommendations(mockRecommendations);
  }, []);

  const categories = [
    { id: 'all', name: 'All Cards', icon: CreditCard },
    { id: 'cashback', name: 'Cashback', icon: TrendingUp },
    { id: 'rewards', name: 'Rewards', icon: Star },
    { id: 'travel', name: 'Travel', icon: Zap },
    { id: 'secured', name: 'Secured', icon: Shield },
  ];

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(card => 
        card.rewardsProgram.toLowerCase().includes(selectedCategory) ||
        card.benefits.some(benefit => 
          benefit.toLowerCase().includes(selectedCategory)
        )
      );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to view credit card recommendations.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Credit Cards
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover the best credit cards for your spending habits and preferences
          </p>
          {preferredCreditCard && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Your preferred card:</strong> {preferredCreditCard}
              </p>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{card.cardName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{card.bankName}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{card.score}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Card Image Placeholder */}
                <div className="w-full h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-12 w-8 text-white" />
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual Fee:</span>
                    <span className="font-medium">
                      {card.annualFee === 0 ? 'Free' : `₹${card.annualFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-medium">{card.interestRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span className="font-medium">{card.creditLimit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cashback:</span>
                    <span className="font-medium text-green-600">
                      Up to {card.cashbackRate}%
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {card.benefits.slice(0, 3).map((benefit, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {benefit}
                      </li>
                    ))}
                    {card.benefits.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{card.benefits.length - 3} more benefits
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button className="flex-1" size="sm">
                    Apply Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Compare
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No cards found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
