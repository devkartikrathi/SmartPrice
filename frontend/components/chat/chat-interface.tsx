"use client";

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { chatAPI, type ChatMessage as ChatMessageType, type ChatRequest, type ChatResponse } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { MessageSquare, Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export function ChatInterface() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeConversationId, setActiveConversationId, preferredCreditCard } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsTyping(true);
      
      // Add user message immediately
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        content,
        type: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      try {
        // Prepare request with new structure
        const request: ChatRequest = {
          query: content,
          credit_card: preferredCreditCard || undefined,
          session_id: activeConversationId || undefined,
        };
        
        const response = await chatAPI.sendMessage(request);
        return response;
      } finally {
        setIsTyping(false);
      }
    },
    onSuccess: (botResponse: ChatResponse) => {
      // Convert backend response to frontend message format
      const botMessage: ChatMessageType = {
        id: botResponse.conversation_id,
        content: botResponse.message,
        type: 'bot',
        timestamp: new Date(botResponse.timestamp),
        intent: botResponse.intent,
        agent_used: botResponse.agent_used,
        data: botResponse.data,
        actions: botResponse.actions,
        status: botResponse.status as 'success' | 'error',
        conversation_id: botResponse.conversation_id,
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation ID if this is a new conversation
      if (botResponse.conversation_id && !activeConversationId) {
        setActiveConversationId(botResponse.conversation_id);
      }
      
      // Handle actions
      if (botResponse.actions?.some(action => action.type === 'purchase' || action.type === 'add_to_cart')) {
        toast.success('Item added to cart!');
      }
      
      // Handle follow-up questions
      if (botResponse.follow_up_questions && botResponse.follow_up_questions.length > 0) {
        toast.info('I have some follow-up questions to better assist you.');
      }
      
      // Handle errors
      if (botResponse.status === 'error' && botResponse.error) {
        toast.error(`Error: ${botResponse.error}`);
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setIsTyping(false);
    },
  });

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
    toast.success('Started new conversation');
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">ADK E-commerce Assistant</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered shopping assistant for products, flights, and groceries
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {preferredCreditCard && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <CreditCard className="h-3 w-3" />
                <span className="text-xs">{preferredCreditCard}</span>
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={startNewConversation}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to ADK Assistant</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  I can help you find the best deals, compare prices, book flights, and optimize your shopping across multiple platforms.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => handleSendMessage("Find me the best laptop deals")}>
                    Find laptop deals
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => handleSendMessage("Book a flight to New York")}>
                    Book flights
                  </Badge>
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => handleSendMessage("Optimize my grocery list")}>
                    Optimize groceries
                  </Badge>
                </div>
              </motion.div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))
            )}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={sendMessageMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}