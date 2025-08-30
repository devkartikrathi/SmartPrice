"use client";

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/product-card';
import { FlightCard } from '@/components/flights/flight-card';
import { GroceryItem } from '@/components/grocery/grocery-item';
import { type ChatMessage as ChatMessageType, type ProductData, type FlightData, type GroceryData, type Action } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Bot, User, ShoppingCart, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { addToCart } = useAppStore();
  const isUser = message.type === 'user';

  const handleAddToCart = (product: ProductData) => {
    addToCart({
      id: `${product.platform}-${Date.now()}`,
      name: product.title,
      originalPrice: product.price,
      bestPrice: product.price,
      platform: product.platform,
      url: product.url,
      image: product.image,
    });
  };

  const renderContent = () => {
    if (message.type === 'user') {
      return (
        <div className="prose prose-sm max-w-none">
          <p className="text-primary-foreground m-0">{message.content}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {message.content && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="m-0">{message.content}</p>
          </div>
        )}

        {/* Render structured data */}
        {message.data && (
          <div className="space-y-4">
            {/* Handle products array */}
            {message.data.products && Array.isArray(message.data.products) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Found Products:</h4>
                {message.data.products.map((product: any, index: number) => (
                  <ProductCard
                    key={index}
                    product={product as ProductData}
                    onAddToCart={() => handleAddToCart(product as ProductData)}
                  />
                ))}
              </div>
            )}
            
            {/* Handle flights array */}
            {message.data.flights && Array.isArray(message.data.flights) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Flight Options:</h4>
                {message.data.flights.map((flight: any, index: number) => (
                  <FlightCard key={index} flight={flight as FlightData} />
                ))}
              </div>
            )}
            
            {/* Handle grocery items array */}
            {message.data.grocery_items && Array.isArray(message.data.grocery_items) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Grocery Items:</h4>
                {message.data.grocery_items.map((item: any, index: number) => (
                  <GroceryItem key={index} item={item as GroceryData} />
                ))}
              </div>
            )}
            
            {/* Handle cart data */}
            {message.data.cart && Array.isArray(message.data.cart) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Shopping Cart:</h4>
                {message.data.cart.map((item: any, index: number) => (
                  <GroceryItem key={index} item={item as GroceryData} />
                ))}
              </div>
            )}
            
            {/* Handle single items */}
            {!Array.isArray(message.data) && (
              <>
                {message.data.title && message.data.price && (
                  <ProductCard
                    product={message.data as ProductData}
                    onAddToCart={() => handleAddToCart(message.data as ProductData)}
                  />
                )}
                {message.data.flightNumber && (
                  <FlightCard flight={message.data as FlightData} />
                )}
                {message.data.name && message.data.options && (
                  <GroceryItem item={message.data as GroceryData} />
                )}
              </>
            )}
            
            {/* Handle summary information */}
            {message.data && typeof message.data === 'object' && 'total_savings' in message.data && typeof (message.data as Record<string, unknown>).total_savings === 'number' && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  💰 Total Savings: ₹{((message.data as Record<string, unknown>).total_savings as number).toFixed(2)}
                </p>
              </div>
            )}
            
            {message.data && typeof message.data === 'object' && 'platform_recommendation' in message.data && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🏆 Recommended Platform: {(message.data as Record<string, unknown>).platform_recommendation as string}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Render actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action: Action, index: number) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  if (action.type === 'open_url' && action.url) {
                    window.open(action.url, '_blank');
                  } else if (action.type === 'add_to_cart' && action.data) {
                    handleAddToCart(action.data);
                  } else if (action.type === 'purchase' && action.data) {
                    handleAddToCart(action.data);
                  }
                }}
                className="text-xs"
              >
                {action.type === 'open_url' && <ExternalLink className="h-3 w-3 mr-1" />}
                {action.type === 'add_to_cart' && <ShoppingCart className="h-3 w-3 mr-1" />}
                {action.type === 'purchase' && <ShoppingCart className="h-3 w-3 mr-1" />}
                {action.label || action.description}
              </Button>
            ))}
          </div>
        )}
        
        {/* Render follow-up questions */}
        {message.follow_up_questions && message.follow_up_questions.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  To better assist you, I need some clarification:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {message.follow_up_questions.map((question, index) => (
                    <li key={index}>• {question}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          {renderContent()}
        </motion.div>

        {/* Metadata */}
        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {message.agent_used && (
            <Badge variant="outline" className="text-xs py-0">
              {message.agent_used}
            </Badge>
          )}
          {message.intent && (
            <Badge variant="secondary" className="text-xs py-0">
              {message.intent}
            </Badge>
          )}
          {message.status === 'error' && (
            <Badge variant="destructive" className="text-xs py-0">
              Error
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}