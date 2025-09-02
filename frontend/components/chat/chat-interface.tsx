"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShoppingCart, Plane, Package, TrendingUp, CreditCard, Clock, MapPin } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { 
  ChatMessage,
  ProductAnalysis, 
  FlightAnalysis, 
  GroceryAnalysis,
  formatCurrency,
  formatPercentage,
  getAgentDisplayName,
  getIntentDisplayName,
  chatAPI,
  OrchestratedResponse
} from '@/lib/api';



export function ChatInterface({ conversationId, onActivity }: { conversationId?: string | null, onActivity?: (u: { id: string, lastMessage?: string, title?: string, updatedAt?: Date }) => void }) {
  const { preferredCreditCard, selectedCreditCards } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState<string | undefined>(undefined);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Load existing messages for this conversation
  useEffect(() => {
    const load = async () => {
      if (!conversationId) return;
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const loaded: ChatMessage[] = (data.messages || []).map((m: any) => ({
            id: m.id,
            content: m.content,
            type: m.type,
            intent: m.intent || undefined,
            agent_used: m.agentUsed || undefined,
            data: m.data || undefined,
            actions: m.actions || undefined,
            timestamp: new Date(m.createdAt),
            status: m.status || 'success',
          }));
          setMessages(loaded);
        }
      } catch {}
    };
    load();
  }, [conversationId]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Create new conversation if none exists
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        const res = await fetch('/api/conversations', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ title: message.slice(0, 60) }) 
        });
        if (res.ok) {
          const { conversation } = await res.json();
          currentConversationId = conversation.id;
          // Notify parent to add this conversation to the sidebar
          if (onActivity && currentConversationId) {
            onActivity({ 
              id: currentConversationId, 
              lastMessage: message, 
              updatedAt: new Date(), 
              title: message.slice(0, 60) 
            });
          }
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }

    if (currentConversationId && onActivity) {
      onActivity({ id: currentConversationId, lastMessage: message, updatedAt: new Date(), title: messages.length === 0 ? message.slice(0, 60) : undefined });
    }
    if (currentConversationId) {
      fetch(`/api/conversations/${currentConversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: userMessage.content, type: 'user', status: 'success' }) });
      // Set title if untitled
      if (messages.length === 0) {
        fetch(`/api/conversations/${currentConversationId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: message.slice(0, 60) }) });
      }
    }
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: 'Analyzing your request...',
      type: 'bot',
      timestamp: new Date(),
      status: 'loading',
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const userCards = selectedCreditCards.length > 0 ? selectedCreditCards : (preferredCreditCard ? [preferredCreditCard] : []);
      const routed: OrchestratedResponse = await (await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, userCards }),
      })).json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: routed.rationale || 'Here are the results.',
        type: 'bot',
        intent: routed.agent,
        agent_used: routed.agent,
        data: routed.details,
        actions: [],
        timestamp: new Date(),
        status: 'success',
        conversation_id: undefined,
        follow_up_questions: [],
      };

      setMessages(prev => prev.map(msg => msg.status === 'loading' ? botMessage : msg));
      if (currentConversationId && onActivity) {
        onActivity({ id: currentConversationId, lastMessage: botMessage.content, updatedAt: new Date() });
      }
      if (currentConversationId) {
        fetch(`/api/conversations/${currentConversationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: botMessage.content, type: 'bot', intent: botMessage.intent, agent_used: botMessage.agent_used, data: botMessage.data, actions: botMessage.actions, status: 'success' }) });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Replace loading message with error
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        type: 'bot',
        timestamp: new Date(),
        status: 'error',
      };

      setMessages(prev => prev.map(msg => 
        msg.status === 'loading' ? errorMessage : msg
      ));
      
      // Save error message to conversation if it exists
      if (currentConversationId) {
        fetch(`/api/conversations/${currentConversationId}/messages`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            content: errorMessage.content, 
            type: 'bot', 
            status: 'error' 
          }) 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderProductAnalysis = (products: ProductAnalysis[]) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>Product Analysis</span>
        </div>
        {products.map((product, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{product.product_title}</span>
                <Badge variant="secondary" className="text-xs">
                  {product.platform}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Original Price</div>
                  <div className="font-semibold">{formatCurrency(product.original_price)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Effective Price</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(product.effective_price)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Savings</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(product.total_discount)} ({formatPercentage(product.savings_percentage)})
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Card Used</div>
                  <div className="font-semibold text-blue-600">{product.recommended_card}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {product.card_benefit_description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderFlightAnalysis = (flights: FlightAnalysis[]) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Plane className="h-4 w-4" />
          <span>Flight Analysis</span>
        </div>
        {flights.map((flight, index) => (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{flight.airline} {flight.flight_number}</span>
                <Badge variant="secondary" className="text-xs">
                  {flight.stops}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Departure</div>
                  <div className="font-semibold">{flight.departure}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Arrival</div>
                  <div className="font-semibold">{flight.arrival}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-semibold">{flight.duration}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Price</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(flight.effective_price)}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {flight.card_benefit_description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderGroceryAnalysis = (groceryItems: GroceryAnalysis[]) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          <span>Grocery Analysis</span>
        </div>
        {groceryItems.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{item.product_title}</span>
                <Badge variant="secondary" className="text-xs">
                  {item.platform}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Unit Price</div>
                  <div className="font-semibold">
                    {formatCurrency(item.unit_price)}/{item.unit_measure}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Quantity</div>
                  <div className="font-semibold">{item.quantity_available}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Price</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(item.effective_price)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Savings</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(item.total_discount)} ({formatPercentage(item.savings_percentage)})
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {item.card_benefit_description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderActions = (actions: any[]) => {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Suggested Actions:</div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.type === 'purchase' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
            >
              {action.type === 'purchase' && <ShoppingCart className="h-3 w-3 mr-1" />}
              {action.type === 'book' && <Plane className="h-3 w-3 mr-1" />}
              {action.type === 'suggestion' && <TrendingUp className="h-3 w-3 mr-1" />}
              {action.description}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderFollowUpQuestions = (questions: string[]) => {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Clarifying Questions:</div>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => setInputValue(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isBot = message.type === 'bot';
    const hasData = message.data && Object.keys(message.data).length > 0;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div className={`max-w-[80%] ${isBot ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-lg p-4`}>
          <div className="text-sm">{message.content}</div>
          
          {/* Agent and Intent Info */}
          {isBot && message.agent_used && (
            <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
              <Badge variant="outline" className="text-xs">
                {getAgentDisplayName(message.agent_used)}
              </Badge>
              {message.intent && (
                <Badge variant="secondary" className="text-xs">
                  {getIntentDisplayName(message.intent)}
                </Badge>
              )}
            </div>
          )}

          {/* Data Analysis */}
          {isBot && hasData && (
            <div className="mt-4 space-y-4">
              {/* Map new orchestrated schemas */}
              {message.intent === 'products' && message.data?.offers && renderProductAnalysis(message.data.offers)}
              {message.intent === 'flights' && message.data?.candidates && renderFlightAnalysis(message.data.candidates)}
              {message.intent === 'groceries' && message.data?.items && renderGroceryAnalysis(message.data.items)}
              
              {message.data?.totals && message.intent === 'groceries' && (
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">Blinkit: {formatCurrency(message.data.totals?.blinkit?.effective || 0)} · Zepto: {formatCurrency(message.data.totals?.zepto?.effective || 0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {isBot && message.actions && message.actions.length > 0 && (
            <div className="mt-4">
              {renderActions(message.actions)}
            </div>
          )}

          {/* Follow-up Questions */}
          {isBot && message.follow_up_questions && message.follow_up_questions.length > 0 && (
            <div className="mt-4">
              {renderFollowUpQuestions(message.follow_up_questions)}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-2 text-xs opacity-50">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Welcome to SmartPrice Assistant</h3>
              <p className="text-muted-foreground">
                I can help you find the best deals on products, groceries, and flights with credit card optimization.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Try asking me:</p>
                <ul className="space-y-1">
                  <li>• "Find me the best iPhone 15 deals"</li>
                  <li>• "Compare grocery prices for milk and bread"</li>
                  <li>• "Search flights from Delhi to Mumbai"</li>
                </ul>
              </div>
              {/* Removed inline selected card indicator */}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map(renderMessage)}
          </div>
        )}
      </ScrollArea>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ask me about products, groceries, or flights..."
        disabled={disabled}
        className="flex-1"
      />
      <Button type="submit" disabled={disabled || !inputValue.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}