"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { healthAPI } from '@/lib/api';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  architecture: string;
  environment: Record<string, boolean>;
  agents: Record<string, any>;
  runners: Record<string, any>;
  tools: Record<string, any>;
}

export function HealthStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = await healthAPI.getStatus();
      setHealth(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check health');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!health && !loading) {
    return (
      <div className="flex items-center space-x-2">
        <Activity className="h-3 w-3" />
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs text-muted-foreground">System Unavailable</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={loading}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Activity className="h-3 w-3 animate-pulse" />
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        <span className="text-xs text-muted-foreground">Checking...</span>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Systems Degraded';
      case 'unhealthy':
        return 'System Issues Detected';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getStatusIcon(health!.status)}
      <div className={`h-2 w-2 rounded-full ${getStatusColor(health!.status)}`} />
      <span className="text-xs text-muted-foreground hidden lg:inline">
        {getStatusLabel(health!.status)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={checkHealth}
        disabled={loading}
        className="h-6 px-2"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
