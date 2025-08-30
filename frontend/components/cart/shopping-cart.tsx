"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import { CartItem } from './cart-item';
import { X, ShoppingCart as ShoppingCartIcon, CreditCard, ExternalLink } from 'lucide-react';

interface ShoppingCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShoppingCart({ open, onOpenChange }: ShoppingCartProps) {
  const { cartItems, clearCart, getCartTotal, getCartItemCount } = useAppStore();

  const totalItems = getCartItemCount();
  const totalPrice = getCartTotal();
  
  // Group items by platform
  const itemsByPlatform = cartItems.reduce((acc, item) => {
    if (!acc[item.platform]) {
      acc[item.platform] = [];
    }
    acc[item.platform].push(item);
    return acc;
  }, {} as Record<string, typeof cartItems>);

  const platformTotals = Object.entries(itemsByPlatform).map(([platform, items]) => ({
    platform,
    items: items.length,
    total: items.reduce((sum, item) => sum + (item.bestPrice * item.quantity), 0),
  }));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => onOpenChange(false)}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                {totalItems > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShoppingCartIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground">
                    Start shopping by asking our AI assistant to find products for you!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t p-4 space-y-4">
                {/* Platform Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Platform Breakdown:</h4>
                  {platformTotals.map(({ platform, items, total }) => (
                    <div key={platform} className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">{platform}</Badge>
                        <span className="text-muted-foreground">({items} items)</span>
                      </div>
                      <span className="font-medium">₹{total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Optimize Payment Methods
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="text-sm"
                    >
                      Clear Cart
                    </Button>
                    <Button
                      variant="outline"
                      className="text-sm"
                      onClick={() => {
                        // Open all platform links
                        platformTotals.forEach(({ platform }) => {
                          const platformItems = itemsByPlatform[platform];
                          if (platformItems.length > 0) {
                            window.open(platformItems[0].url, '_blank');
                          }
                        });
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Checkout
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}