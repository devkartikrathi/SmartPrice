"use client";

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MessageSquare, 
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useAppStore } from '@/lib/store';
import { creditCardsAPI, CreditCard as CreditCardType } from '@/lib/api';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  unread: boolean;
}

export default function ChatPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { preferredCreditCard, setPreferredCreditCard, selectedCreditCards, setSelectedCreditCards } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoadingCards(true);
        const response = await creditCardsAPI.getAll();
        setCreditCards(response.credit_cards);
      } catch (error: any) {
        setCardsError(error.message || 'Failed to load credit cards');
      } finally {
        setIsLoadingCards(false);
      }
      try {
        const res = await fetch('/api/conversations', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = (data.conversations || []).map((c: any) => ({ id: c.id, title: c.title, timestamp: new Date(c.updatedAt), unread: false }));
          setChatHistory(list);
          if (list.length > 0) setSelectedChat(list[0].id);
        }
      } catch {}
    };
    bootstrap();
  }, []);

  const startNewChat = () => {
    (async () => {
      const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) });
      if (res.ok) {
        const { conversation } = await res.json();
        const newChat: ChatHistory = { id: conversation.id, title: conversation.title, timestamp: new Date(conversation.updatedAt), unread: false };
        setChatHistory(prev => [newChat, ...prev]);
        setSelectedChat(newChat.id);
      }
    })();
  };

  const selectChat = (chatId: string) => {
    setSelectedChat(chatId);
    // Mark as read
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId ? { ...chat, unread: false } : chat
      )
    );
  };

  const deleteChat = (chatId: string) => {
    (async () => {
      await fetch(`/api/conversations/${chatId}`, { method: 'DELETE' });
      setChatHistory(prev => prev.filter(c => c.id !== chatId));
      if (selectedChat === chatId) setSelectedChat(null);
    })();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getCardDisplayName = (cardId: string) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.display_name : cardId;
  };

  const getCardDetails = (cardId: string) => {
    return creditCards.find(c => c.id === cardId);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={`border-r bg-muted/30 flex flex-col transition-all duration-200 ${collapsed ? 'w-14' : 'w-80'} h-full overflow-y-auto`}
      >
        {/* Collapse Toggle */}
        <div className="p-2 border-b flex justify-end">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        </div>
        {/* New Chat Button */}
        <div className="p-2 border-b">
          <Button onClick={startNewChat} className={`w-full ${collapsed ? 'justify-center' : 'justify-start'}`} variant="outline">
            <Plus className={`h-4 w-4 ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && 'New Chat'}
          </Button>
        </div>

        {/* Chat History */}
        {/* Chat list with its own scrollbar */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <motion.div
                key={chat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`flex items-center w-full relative group`}>
                  <Button
                    variant={selectedChat === chat.id ? "secondary" : "ghost"}
                    className={`flex-1 h-auto ${collapsed ? 'justify-center p-2' : 'justify-start p-3'}`}
                    onClick={() => selectChat(chat.id)}
                  >
                    {collapsed ? (
                      <MessageSquare className="h-4 w-4" />
                    ) : (
                      <div className="flex flex-col items-start w-full">
                        <div className="flex items-center w-full">
                          <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {chat.title}
                          </span>
                          {chat.unread && (
                            <Badge variant="destructive" className="ml-2 h-2 w-2 p-0" />
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">
                            {chat.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0 text-foreground hover:text-foreground hover:bg-muted ml-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChat(chat.id);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </Button>

                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Sidebar footer removed */}
      </div>

      {/* Main Chat Area with independent scroll */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="flex-1">
          <ChatInterface
            key={selectedChat || 'default'}
            conversationId={selectedChat}
            onActivity={({ id, lastMessage, title, updatedAt }) => {
              setChatHistory(prev => {
                // Check if this conversation already exists
                const existingIndex = prev.findIndex(c => c.id === id);
                if (existingIndex >= 0) {
                  // Update existing conversation
                  return prev.map(c => c.id === id ? { ...c, title: title ?? c.title, timestamp: updatedAt ?? new Date(), unread: false } : c);
                } else {
                  // Add new conversation to the top of the list
                  const newChat = { id, title: title ?? 'New Chat', timestamp: updatedAt ?? new Date(), unread: false };
                  setSelectedChat(id); // Auto-select the new conversation
                  return [newChat, ...prev];
                }
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}