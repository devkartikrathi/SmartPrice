"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  CreditCard, 
  ShoppingBag, 
  Plane, 
  Utensils, 
  Film, 
  Zap, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { OnboardingStep } from './onboarding-step';
import { CreditCardForm } from './credit-card-form';
import { useAppStore } from '@/lib/store';

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

const STEPS = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    icon: User,
    description: 'Tell us about yourself and your work'
  },
  {
    id: 'spending-patterns',
    title: 'Spending Patterns',
    icon: ShoppingBag,
    description: 'Understand your shopping and spending habits'
  },
  {
    id: 'preferences',
    title: 'Preferences',
    icon: TrendingUp,
    description: 'Your shopping and platform preferences'
  },
  {
    id: 'credit-cards',
    title: 'Credit Cards',
    icon: CreditCard,
    description: 'Add your credit cards for better deals'
  },
  {
    id: 'review',
    title: 'Review & Complete',
    icon: CheckCircle,
    description: 'Review your information and complete setup'
  }
];

const OCCUPATIONS = [
  'Student', 'Freelancer', 'Employee', 'Business Owner', 'Entrepreneur', 
  'Professional', 'Retired', 'Other'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
  'Consulting', 'Marketing', 'Real Estate', 'Other'
];

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '500+'
];

const INCOME_RANGES = [
  '0-25k', '25k-50k', '50k-100k', '100k-200k', '200k+'
];

const SPENDING_RANGES = [
  '0-10k', '10k-25k', '25k-50k', '50k-100k', '100k+'
];

const SPENDING_CATEGORIES = [
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-blue-400' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'bg-emerald-400' },
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-amber-400' },
  { id: 'entertainment', label: 'Entertainment', icon: Film, color: 'bg-purple-400' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-orange-400' },
  { id: 'other', label: 'Other', icon: TrendingUp, color: 'bg-slate-400' }
];

const FREQUENCIES = [
  'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Never'
];

const PLATFORMS = [
  'Amazon', 'Flipkart', 'Myntra', 'Nykaa', 'Swiggy', 'Zomato', 'MakeMyTrip',
  'Goibibo', 'BookMyShow', 'Netflix', 'Prime Video', 'Other'
];

const CREDIT_SCORES = [
  'Excellent (750+)', 'Good (700-749)', 'Fair (650-699)', 'Poor (below 650)'
];

const INVESTMENT_LEVELS = [
  'Beginner', 'Intermediate', 'Advanced'
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    occupation: '',
    industry: '',
    companySize: '',
    monthlyIncome: '',
    monthlySpending: '',
    primarySpendingCategory: '',
    secondarySpendingCategory: '',
    shoppingFrequency: '',
    preferredPlatforms: [],
    travelFrequency: '',
    groceryFrequency: '',
    creditScore: '',
    investmentExperience: ''
  });
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setPreferredCreditCard } = useAppStore();

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataChange = (field: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreditCardAdd = (card: any) => {
    setCreditCards(prev => [...prev, card]);
  };

  const handleCreditCardRemove = (index: number) => {
    setCreditCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Submit to API
      console.log('Submitting onboarding data:', { onboardingData, creditCards });
      
      // Set default credit card if available
      if (creditCards.length > 0) {
        const defaultCard = creditCards.find(card => card.isDefault) || creditCards[0];
        setPreferredCreditCard(defaultCard.cardName);
      }
      
      // Mark user as onboarded
      // TODO: Update user status in database
      
      // Call onComplete callback
      onComplete();
      
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <OnboardingStep
            title="Tell us about yourself"
            description="This helps us personalize your experience and find the best deals for you."
          >
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Occupation</label>
                <div className="grid grid-cols-2 gap-3">
                  {OCCUPATIONS.map((occupation) => (
                    <Button
                      key={occupation}
                      variant={onboardingData.occupation === occupation ? "default" : "outline"}
                      onClick={() => handleDataChange('occupation', occupation)}
                      className="justify-start"
                    >
                      {occupation}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRIES.map((industry) => (
                    <Button
                      key={industry}
                      variant={onboardingData.industry === industry ? "default" : "outline"}
                      onClick={() => handleDataChange('industry', industry)}
                      className="justify-start"
                    >
                      {industry}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Company Size</label>
                <div className="grid grid-cols-3 gap-3">
                  {COMPANY_SIZES.map((size) => (
                    <Button
                      key={size}
                      variant={onboardingData.companySize === size ? "default" : "outline"}
                      onClick={() => handleDataChange('companySize', size)}
                      className="justify-start"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Income</label>
                <div className="grid grid-cols-2 gap-3">
                  {INCOME_RANGES.map((income) => (
                    <Button
                      key={income}
                      variant={onboardingData.monthlyIncome === income ? "default" : "outline"}
                      onClick={() => handleDataChange('monthlyIncome', income)}
                      className="justify-start"
                    >
                      ₹{income}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </OnboardingStep>
        );

      case 1: // Spending Patterns
        return (
          <OnboardingStep
            title="Understanding your spending habits"
            description="This helps us recommend the best credit cards and deals for your lifestyle."
          >
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Spending</label>
                <div className="grid grid-cols-2 gap-3">
                  {SPENDING_RANGES.map((spending) => (
                    <Button
                      key={spending}
                      variant={onboardingData.monthlySpending === spending ? "default" : "outline"}
                      onClick={() => handleDataChange('monthlySpending', spending)}
                      className="justify-start"
                    >
                      ₹{spending}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Primary Spending Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {SPENDING_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      variant={onboardingData.primarySpendingCategory === category.id ? "default" : "outline"}
                      onClick={() => handleDataChange('primarySpendingCategory', category.id)}
                      className="justify-start"
                    >
                      <div className={`w-3 h-3 rounded-full ${category.color} mr-2`} />
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Secondary Spending Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {SPENDING_CATEGORIES
                    .filter(cat => cat.id !== onboardingData.primarySpendingCategory)
                    .map((category) => (
                    <Button
                      key={category.id}
                      variant={onboardingData.secondarySpendingCategory === category.id ? "default" : "outline"}
                      onClick={() => handleDataChange('secondarySpendingCategory', category.id)}
                      className="justify-start"
                    >
                      <div className={`w-3 h-3 rounded-full ${category.color} mr-2`} />
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Shopping Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  {FREQUENCIES.slice(0, 4).map((frequency) => (
                    <Button
                      key={frequency}
                      variant={onboardingData.shoppingFrequency === frequency ? "default" : "outline"}
                      onClick={() => handleDataChange('shoppingFrequency', frequency)}
                      className="justify-start"
                    >
                      {frequency}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </OnboardingStep>
        );

      case 2: // Preferences
        return (
          <OnboardingStep
            title="Your shopping preferences"
            description="Help us understand where you shop and what you prefer."
          >
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Platforms</label>
                <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map((platform) => (
                    <Button
                      key={platform}
                      variant={onboardingData.preferredPlatforms.includes(platform) ? "default" : "outline"}
                      onClick={() => {
                        const current = onboardingData.preferredPlatforms;
                        if (current.includes(platform)) {
                          handleDataChange('preferredPlatforms', current.filter(p => p !== platform));
                        } else {
                          handleDataChange('preferredPlatforms', [...current, platform]);
                        }
                      }}
                      className="justify-start"
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Travel Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  {FREQUENCIES.map((frequency) => (
                    <Button
                      key={frequency}
                      variant={onboardingData.travelFrequency === frequency ? "default" : "outline"}
                      onClick={() => handleDataChange('travelFrequency', frequency)}
                      className="justify-start"
                    >
                      {frequency}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Grocery Shopping Frequency</label>
                <div className="grid grid-cols-2 gap-3">
                  {FREQUENCIES.slice(0, 3).map((frequency) => (
                    <Button
                      key={frequency}
                      variant={onboardingData.groceryFrequency === frequency ? "default" : "outline"}
                      onClick={() => handleDataChange('groceryFrequency', frequency)}
                      className="justify-start"
                    >
                      {frequency}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Credit Score Range</label>
                <div className="grid grid-cols-2 gap-3">
                  {CREDIT_SCORES.map((score) => (
                    <Button
                      key={score}
                      variant={onboardingData.creditScore === score ? "default" : "outline"}
                      onClick={() => handleDataChange('creditScore', score)}
                      className="justify-start"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Investment Experience</label>
                <div className="grid grid-cols-3 gap-3">
                  {INVESTMENT_LEVELS.map((level) => (
                    <Button
                      key={level}
                      variant={onboardingData.investmentExperience === level ? "default" : "outline"}
                      onClick={() => handleDataChange('investmentExperience', level)}
                      className="justify-start"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </OnboardingStep>
        );

      case 3: // Credit Cards
        return (
          <OnboardingStep
            title="Add your credit cards"
            description="This helps us find the best deals and cashback offers for you."
          >
            <div className="space-y-6">
              <CreditCardForm onAdd={handleCreditCardAdd} />
              
              {creditCards.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Your Credit Cards</h4>
                  <div className="space-y-3">
                    {creditCards.map((card, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{card.cardName}</p>
                            <p className="text-sm text-muted-foreground">{card.bankName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {card.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreditCardRemove(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </OnboardingStep>
        );

      case 4: // Review
        return (
          <OnboardingStep
            title="Review your information"
            description="Please review all the information before completing your setup."
          >
            <div className="space-y-6">
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
                  <h4 className="font-medium mb-3">Credit Cards</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Total Cards:</span> {creditCards.length}</p>
                    {creditCards.length > 0 && (
                      <p><span className="text-muted-foreground">Default Card:</span> {creditCards.find(c => c.isDefault)?.cardName || 'None'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We'll analyze your spending patterns to find the best deals</li>
                  <li>• Get personalized credit card recommendations</li>
                  <li>• Receive alerts for deals matching your preferences</li>
                  <li>• Track your spending and savings across platforms</li>
                </ul>
              </div>
            </div>
          </OnboardingStep>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return onboardingData.occupation && onboardingData.industry && onboardingData.companySize && onboardingData.monthlyIncome;
      case 1:
        return onboardingData.monthlySpending && onboardingData.primarySpendingCategory && onboardingData.shoppingFrequency;
      case 2:
        return onboardingData.preferredPlatforms.length > 0 && onboardingData.travelFrequency && onboardingData.groceryFrequency;
      case 3:
        return true; // Credit cards are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to continue with onboarding.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to SmartPrice!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Let's set up your personalized shopping experience
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep + 1} of {STEPS.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : 'border-gray-300 bg-gray-100 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? 'Completing...' : 'Complete Setup'}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
