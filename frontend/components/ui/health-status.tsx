"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Server, Cpu, Database, Zap } from 'lucide-react';
import { healthAPI, HealthStatus as HealthStatusType } from '@/lib/api';

export function HealthStatus() {
  const [healthData, setHealthData] = useState<HealthStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await healthAPI.getStatus();
      setHealthData(data);
      setLastChecked(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to check health status');
      setHealthData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading && !healthData) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error && !healthData) {
    return (
      <Card className="w-full max-w-sm border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            System Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button size="sm" variant="outline" onClick={checkHealth} className="w-full">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return null;
  }

  const isHealthy = healthData.status.toLowerCase() === 'healthy';
  const activeAgents = Object.keys(healthData.agents || {}).filter(
    key => healthData.agents[key]?.status === 'active'
  ).length;
  const totalAgents = Object.keys(healthData.agents || {}).length;
  const activeTools = Object.keys(healthData.tools || {}).filter(
    key => healthData.tools[key] === 'available'
  ).length;
  const totalTools = Object.keys(healthData.tools || {}).length;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2 py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon(healthData.status)}
            System Status
          </span>
          <Badge className={getStatusColor(healthData.status)}>
            {healthData.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* System Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Server className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Version:</span>
            <span className="font-medium">{healthData.version}</span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Arch:</span>
            <span className="font-medium">{healthData.architecture}</span>
          </div>
        </div>

        <Separator />

        {/* Agents Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI Agents</span>
            <span className="font-medium">
              {activeAgents}/{totalAgents} Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(healthData.agents || {}).map(([name, agent]: [string, any]) => (
              <div key={name} className="flex items-center gap-1 text-xs">
                {agent.status === 'active' ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tools Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tools</span>
            <span className="font-medium">
              {activeTools}/{totalTools} Available
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(healthData.tools || {}).slice(0, 4).map(([name, status]: [string, any]) => (
              <div key={name} className="flex items-center gap-1 text-xs">
                {status === 'available' ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Session Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Active Sessions</span>
          <span className="font-medium">{healthData.components?.sessions || 0}</span>
        </div>

        {/* Last Checked */}
        {lastChecked && (
          <div className="text-xs text-muted-foreground text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button size="icon" variant="outline" onClick={checkHealth} disabled={isLoading} className="h-7 w-7">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
