"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type ProductData } from '@/lib/api';
import { ExternalLink, ShoppingCart, Star, TrendingDown } from 'lucide-react';

interface ProductCardProps {
  product: ProductData;
  onAddToCart?: () => void;
  variant?: 'compact' | 'detailed';
}

export function ProductCard({ product, onAddToCart, variant = 'detailed' }: ProductCardProps) {
  const savings = product.originalPrice && product.price < product.originalPrice
    ? ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0)
    : null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          <div className={`flex ${variant === 'compact' ? 'flex-row' : 'flex-col'} h-full`}>
            {/* Product Image */}
            {product.image && (
              <div className={`relative ${variant === 'compact' ? 'w-24 h-24' : 'w-full h-48'} bg-muted`}>
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes={variant === 'compact' ? '96px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                />
                {savings && (
                  <Badge
                    variant="destructive"
                    className="absolute top-2 left-2 text-xs flex items-center gap-1"
                  >
                    <TrendingDown className="h-3 w-3" />
                    {savings}% OFF
                  </Badge>
                )}
              </div>
            )}

            {/* Product Details */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold ${variant === 'compact' ? 'text-sm' : 'text-base'} line-clamp-2`}>
                  {product.title}
                </h3>
                <Badge variant="outline" className="ml-2 text-xs">
                  {product.platform}
                </Badge>
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground ml-1">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Credit Card Benefit */}
              {product.creditCardBenefit && (
                <div className="mb-3">
                  <Badge variant="secondary" className="text-xs">
                    💳 {product.creditCardBenefit}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(product.url, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Button>
                {onAddToCart && (
                  <Button
                    size="sm"
                    onClick={onAddToCart}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}