"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { Minus, Plus, Trash2, ExternalLink } from 'lucide-react';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    originalPrice: number;
    bestPrice: number;
    platform: string;
    quantity: number;
    url: string;
    image?: string;
  };
}

export function CartItem({ item }: CartItemProps) {
  const { updateCartQuantity, removeFromCart } = useAppStore();

  const subtotal = item.bestPrice * item.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-lg border p-3"
    >
      <div className="flex gap-3">
        {/* Product Image */}
        {item.image && (
          <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2 flex-shrink-0"
              onClick={() => removeFromCart(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {item.platform}
            </Badge>
            <span className="text-sm font-semibold">₹{item.bestPrice.toFixed(2)}</span>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => window.open(item.url, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              <span className="text-sm font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}