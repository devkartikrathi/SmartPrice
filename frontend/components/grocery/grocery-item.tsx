"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type GroceryData, type ProductData } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Plus, Minus, ShoppingCart, ExternalLink } from 'lucide-react';

interface GroceryItemProps {
  item: GroceryData;
}

export function GroceryItem({ item }: GroceryItemProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useAppStore();

  const selectedProduct = item;

  const handleAddToCart = () => {
    if (selectedProduct) {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          id: `${selectedProduct.platform}-${Date.now()}-${i}`,
          name: selectedProduct.title,
          originalPrice: selectedProduct.price,
          bestPrice: selectedProduct.price,
          platform: selectedProduct.platform,
          url: '#',
          image: '',
        });
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Item Name */}
            <div>
              <h4 className="font-semibold text-lg">{item.title}</h4>
              <p className="text-sm text-muted-foreground">
                1 option available
              </p>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Choose Product:</label>
              <Select
                value={selectedIndex.toString()}
                onValueChange={(value) => setSelectedIndex(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate mr-4">{item.title}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {item.platform}
                        </Badge>
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selected Product Details */}
            {selectedProduct && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{selectedProduct.platform}</Badge>
                  <span className="font-semibold text-lg">${selectedProduct.price.toFixed(2)}</span>
                </div>

              </div>
            )}

            {/* Quantity and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedProduct && window.open('#', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add ({quantity})
                </Button>
              </div>
            </div>

            {/* Total */}
            {selectedProduct && quantity > 1 && (
              <div className="text-right text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">
                  ${(selectedProduct.price * quantity).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}