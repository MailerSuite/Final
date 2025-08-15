import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createWebSocket } from '@/utils/websocket';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from 'sonner';
import axiosInstance from '@/http/axios';

interface ServiceStatus {
  overall_status: 'healthy' | 'degraded' | 'critical';
  uptime_percentage: number;
  avg_latency_ms: number;
  service_health: 'operational' | 'issues_detected';
  timestamp: string;
  last_updated: string;
  endpoints: {
    total: number;
    successful: number;
    failed: number;
  };
}

const ServiceStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://localhost:8000/ws/monitoring`;
    const newWs = createWebSocket(wsUrl);

    newWs.onopen = () => {
      setWsConnected(true);

      // Subscribe to monitoring updates (customer view)
      newWs.send(JSON.stringify({
        type: 'subscribe_monitoring',
        user_type: 'customer'
      }));
    };

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'monitoring_update') {
        setStatus(prevStatus => ({
          ...prevStatus,
          ...message.data,
        }));
        setLastUpdated(new Date());
      } else if (message.type === 'alert' && !message.alert.admin_only) {
        toast.info(message.alert.message);
      }
    };

    newWs.onclose = () => {
      setWsConnected(false);
      // Reconnect after 10 seconds for customers (less aggressive)
      setTimeout(connectWebSocket, 10000);
    };

    newWs.onerror = () => {
      setWsConnected(false);
    };

    setWs(newWs);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/v1health/monitoring');
      setStatus(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      // Show a fallback status for customers
      setStatus({
        overall_status: 'critical',
        uptime_percentage: 0,
        avg_latency_ms: 0,
        service_health: 'issues_detected',
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        endpoints: { total: 0, successful: 0, failed: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    connectWebSocket();

    // Auto-refresh every 60 seconds for customers (less frequent)
    const interval = setInterval(() => {
      if (!wsConnected) {
        fetchStatus();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, [fetchStatus, connectWebSocket, wsConnected, ws]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Minor Issues Detected';
      case 'critical':
        return 'Service Disruption';
      default:
        return 'Status Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking service status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Unable to check service status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={`w-full max-w-md border ${getStatusColor(status.overall_status)}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Main Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.overall_status)}
                <div>
                  <p className="font-medium text-sm">{getStatusText(status.overall_status)}</p>
                  <p className="text-xs text-muted-foreground">
                    {status.service_health === 'operational' ? 'Services running normally' : 'Some services affected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {wsConnected ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <Wifi className="h-3 w-3 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Real-time updates active</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger>
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Polling for updates</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="space-y-1">
                      <TrendingUp className="h-3 w-3 mx-auto text-blue-500" />
                      <p className="text-lg font-semibold">{status.uptime_percentage.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Service availability percentage</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="space-y-1">
                      <Clock className="h-3 w-3 mx-auto text-yellow-500" />
                      <p className="text-lg font-semibold">{Math.round(status.avg_latency_ms)}ms</p>
                      <p className="text-xs text-muted-foreground">Response</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average response time</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="space-y-1">
                      <Activity className="h-3 w-3 mx-auto text-green-500" />
                      <p className="text-lg font-semibold">{status.endpoints.successful}/{status.endpoints.total}</p>
                      <p className="text-xs text-muted-foreground">Services</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Operational services count</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge
                variant={status.overall_status === 'healthy' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {status.overall_status.charAt(0).toUpperCase() + status.overall_status.slice(1)}
              </Badge>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchStatus}
                    className="h-6 px-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh status</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground text-center">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ServiceStatusWidget; 