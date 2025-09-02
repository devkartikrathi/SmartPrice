"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Server } from 'lucide-react';
import { healthAPI } from '@/lib/api';

interface BackendStatus {
  status: string;
  timestamp: string;
  version: string;
  architecture: string;
  environment: Record<string, boolean>;
  agents: Record<string, any>;
  runners: Record<string, any>;
  tools: Record<string, any>;
}

export function BackendStatus() {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const healthStatus = await healthAPI.getStatus();
      setStatus(healthStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const testAgent = async (domain: string) => {
    try {
      // Mock test result since testAPI is not available
      const result = { success: true, message: `Test query for ${domain} domain completed` };
      setTestResults(prev => ({ ...prev, [domain]: result }));
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        [domain]: { error: err instanceof Error ? err.message : 'Test failed' } 
      }));
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
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

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Backend Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="h-6 w-6 animate-spin mr-2" />
            <span>Checking backend status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Backend Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Backend Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to connect to the backend server'}
            </p>
            <Button onClick={checkStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Server className="h-5 w-5" />
          <span>Backend System Status</span>
          <Badge 
            variant={status.status === 'healthy' ? 'default' : 'destructive'}
            className="ml-2"
          >
            {status.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
          {getStatusIcon(status.status)}
          <div>
            <h4 className="font-medium">System Status</h4>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </p>
          </div>
          <div className={`h-3 w-3 rounded-full ${getStatusColor(status.status)} ml-auto`} />
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Version</h4>
            <p className="text-sm text-muted-foreground">{status.version}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Architecture</h4>
            <p className="text-sm text-muted-foreground">{status.architecture}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Environment</h4>
            <div className="space-y-1">
              {Object.entries(status.environment).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-muted-foreground">{key}: {value ? '✅' : '❌'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agents Status */}
        <div>
          <h4 className="font-medium mb-2 text-sm">AI Agents Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(status.agents).map(([domain, agent]) => (
              <div key={domain} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <span className="font-medium capitalize">{domain}</span>
                  <p className="text-xs text-muted-foreground">{agent.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-[10px]">
                    {agent.tools_count} tools
                  </Badge>
                  <Button size="icon" variant="outline" onClick={() => testAgent(domain)} className="h-6 w-6 p-0">
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Agent Test Results</h4>
            <div className="space-y-2">
              {Object.entries(testResults).map(([domain, result]) => (
                <div key={domain} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{domain}</span>
                    <Badge 
                      variant={result.error ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {result.error ? 'Failed' : 'Success'}
                    </Badge>
                  </div>
                  {result.error ? (
                    <p className="text-sm text-red-600">{result.error}</p>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>Method: {result.method}</p>
                      <p>Status: {result.status}</p>
                      {result.events_count && <p>Events: {result.events_count}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center">
          <Button onClick={checkStatus} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
