/**
 * API Debug Dashboard - Development tool for monitoring API errors
 * Only shows in development mode
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiDebugger } from '../../utils/api-debug';

interface APIDebugDashboardProps {
  enabled?: boolean;
}

export const ApiDebugDashboard: React.FC<APIDebugDashboardProps> = ({ 
  enabled = import.meta.env.DEV 
}) => {
  const [errors, setErrors] = useState(apiDebugger.getErrors());
  const [summary, setSummary] = useState(apiDebugger.getErrorSummary());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleApiError = () => {
      setErrors(apiDebugger.getErrors());
      setSummary(apiDebugger.getErrorSummary());
    };

    window.addEventListener('apiError', handleApiError);
    
    // Refresh every 5 seconds
    const interval = setInterval(handleApiError, 5000);

    return () => {
      window.removeEventListener('apiError', handleApiError);
      clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled || !isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
      >
        🔧 Debug ({(summary as any).total || 0})
      </Button>
    );
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'gray';
    if (status >= 500) return 'red';
    if (status >= 400) return 'yellow';
    return 'green';
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
  };

  return (
    <div className="fixed inset-4 z-50 bg-white border-2 border-red-300 rounded-lg shadow-xl">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold text-red-800">
          🔧 API Debug Dashboard
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              apiDebugger.clearErrors();
              setErrors([]);
              setSummary(apiDebugger.getErrorSummary());
            }}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="p-4 h-[calc(100vh-8rem)] overflow-hidden">
        <Tabs defaultValue="summary" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="500s">500 Errors</TabsTrigger>
            <TabsTrigger value="all">All Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle>Error Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>Total Errors: <Badge variant="destructive">{(summary as any).total}</Badge></div>
                    <div>Recent (5min): <Badge variant="secondary">{(summary as any).recent}</Badge></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries((summary as any).byStatus || {}).map(([status, count]) => (
                      <div key={status} className="flex justify-between">
                        <Badge variant={getStatusColor(parseInt(status)) as any}>
                          {status}
                        </Badge>
                        <span>{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {errors.filter(e => e.status === 500).length > 0 && (
              <Alert className="border-red-300 bg-red-50">
                <AlertDescription>
                  <strong>500 Errors Detected!</strong> Check backend logs and database connections.
                  Common causes: missing models, import errors, database relationship issues.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {apiDebugger.getRecentErrors().map((error, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant={getStatusColor(error.status) as any}>
                          {error.status || 'Network'}
                        </Badge>
                        <Badge variant="outline">
                          {error.method} {error.url}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(error.duration)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {error.errorMessage}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="500s" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {apiDebugger.getErrorsByStatus(500).map((error, index) => (
                  <Card key={index} className="p-3 border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="destructive">500 - Server Error</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {error.method} {error.url}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {error.errorMessage}
                    </div>
                    {error.responseData && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer">Response Data</summary>
                        <pre className="text-xs bg-muted p-2 mt-1 rounded overflow-auto">
                          {JSON.stringify(error.responseData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant={getStatusColor(error.status) as any}>
                          {error.status || 'Network'}
                        </Badge>
                        <Badge variant="outline">
                          {error.method}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {error.url}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {error.errorMessage}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiDebugDashboard; 