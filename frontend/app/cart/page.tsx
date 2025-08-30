"use client";

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, ExternalLink, CreditCard } from 'lucide-react';
import { CartItem } from '@/components/cart/cart-item';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, getCartItemCount, getTotalSavings } = useAppStore();
  const cartItemCount = getCartItemCount();
  const totalSavings = getTotalSavings();

  if (cartItemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start shopping to add items to your cart and compare prices across platforms.
          </p>
          <Button asChild>
            <a href="/chat">Start Shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items ({cartItemCount})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index}>
                    <CartItem item={item} />
                    {index < cartItems.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cart Actions */}
            <div className="mt-4 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
              
              <Button variant="outline">
                Continue Shopping
              </Button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items:</span>
                    <span>{cartItemCount}</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Total Savings:</span>
                      <span className="text-green-600 font-medium">
                        ₹{totalSavings.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span>Total Estimated Savings:</span>
                    <span className="text-green-600 font-medium">
                      ₹{totalSavings.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full mb-3">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Checkout with Best Deals
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Deals
                  </Button>
                </div>

                {/* Savings Breakdown */}
                {totalSavings > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Savings Breakdown</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {cartItems.map((item, index) => {
                        const savings = item.originalPrice - item.bestPrice;
                        if (savings > 0) {
                          return (
                            <div key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="text-green-600">₹{savings.toFixed(2)}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations */}
        {cartItems.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cartItems.slice(0, 4).map((item, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Similar items you might like
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
