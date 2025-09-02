"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  TrendingUp, 
  CreditCard, 
  ShoppingBag, 
  Zap, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Chat',
    description: 'Get personalized product recommendations using natural language. Ask for anything from "best laptop under 50k" to "deals on smartphones".',
    color: 'text-blue-500'
  },
  {
    icon: TrendingUp,
    title: 'Smart Price Comparison',
    description: 'Compare prices across Amazon, Flipkart, Myntra, and more platforms to find the best deals and save money.',
    color: 'text-indigo-500'
  },
  {
    icon: CreditCard,
    title: 'Credit Card Optimization',
    description: 'Get recommendations on which credit card to use for maximum cashback and rewards on your purchases.',
    color: 'text-purple-500'
  },
  {
    icon: ShoppingBag,
    title: 'Personalized Shopping',
    description: 'AI learns your preferences and spending habits to provide tailored recommendations and deals.',
    color: 'text-emerald-500'
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get real-time price comparisons, availability checks, and deal alerts across multiple platforms.',
    color: 'text-amber-500'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security. We never share your personal information.',
    color: 'text-rose-500'
  }
];

const benefits = [
  'Save up to 40% on your purchases',
  'Get personalized credit card recommendations',
  'Compare prices across 10+ platforms',
  'AI-powered shopping assistant',
  'Real-time deal alerts',
  'Secure payment integration'
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
                      <Badge variant="secondary" className="mb-4">
            🚀 SmartPrice - AI-Powered Shopping Assistant
          </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Shop Smarter,
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
              {' '}Save More
            </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Get personalized product recommendations, compare prices across platforms, and optimize your credit card usage with our AI-powered shopping assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/chat">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/cards">View Credit Cards</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose SmartPrice?
          </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI-powered platform combines the best of e-commerce, price comparison, and financial optimization.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${feature.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Start Saving Today
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Join thousands of smart shoppers who are already saving money with our platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  What You'll Get
                </h3>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
                             <div className="bg-white dark:bg-slate-900 rounded-lg p-8 shadow-lg">
                <div className="text-center">
                  <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Join the Smart Shopping Revolution
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Get started in minutes and start saving on your next purchase.
                  </p>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/chat">
                      Try It Now - It's Free!
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section removed */}
    </div>
  );
}