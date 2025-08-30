"use client";

import { ChatInterface } from '@/components/chat/chat-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, TrendingUp, CreditCard, ShoppingBag } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Shopping Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get personalized product recommendations, compare prices across platforms, and find the best deals using natural language.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Natural Language</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ask for products in your own words. "Find me a good laptop under 50k" or "Show me deals on smartphones"
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-lg">Price Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Compare prices across multiple platforms like Amazon, Flipkart, Myntra, and more to find the best deals
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-6 w-6 text-purple-500 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Credit Card Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get recommendations on which credit card to use for maximum cashback and rewards on your purchases
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Example Prompts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Try These Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Product Search</h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">• "Find me a wireless mouse under ₹1000"</p>
                  <p className="text-xs text-muted-foreground">• "Show me the best gaming laptops in 2024"</p>
                  <p className="text-xs text-muted-foreground">• "Compare prices for iPhone 15 across platforms"</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Deals & Offers</h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">• "What are the best deals on electronics today?"</p>
                  <p className="text-xs text-muted-foreground">• "Show me cashback offers on fashion items"</p>
                  <p className="text-xs text-muted-foreground">• "Find discounts on home appliances"</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}