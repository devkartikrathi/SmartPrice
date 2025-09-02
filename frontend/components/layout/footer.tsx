"use client";

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { healthAPI } from '@/lib/api';

export function Footer() {
  const { data: healthStatus } = useQuery({
    queryKey: ['health'],
    queryFn: healthAPI.getStatus,
    refetchInterval: 60000, // Refresh every minute
  });

  return (
    <footer className="border-t bg-background/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-sm text-muted-foreground">
              © 2025 ADK E-commerce Orchestrator. All rights reserved.
            </p>
            
            {healthStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Powered by:</span>
                <Badge variant="secondary" className="text-xs">
                  AI Assistant
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Price Comparison
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Credit Card Optimization
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}