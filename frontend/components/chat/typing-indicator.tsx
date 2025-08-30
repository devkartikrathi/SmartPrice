"use client";

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center space-x-1"
      >
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full typing-dot" />
        </div>
        <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
      </motion.div>
    </div>
  );
}