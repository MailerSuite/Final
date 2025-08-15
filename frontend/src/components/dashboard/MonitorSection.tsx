import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Server,
  Database,
  Activity,
  Clock,
  Cpu,
  HardDrive,
  Terminal,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonitorMetric {
  timestamp: string;
  value: number;
}

interface ServiceMonitor {
  name: string;
  service: string;
  status: 'operational' | 'degraded' | 'down';
  cpu: number;
  memory: number;
  lastLog: string;
  icon: React.ReactNode;
  uptime: string;
  cpuHistory: MonitorMetric[];
  memoryHistory: MonitorMetric[];
}

export const MonitorSection: React.FC<{ className?: string }> = ({ className }) => {
  const [services, setServices] = useState<ServiceMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock time series data
  const generateTimeSeriesData = (baseValue: number, variance: number = 10): MonitorMetric[] => {
    const data: MonitorMetric[] = [];
    const now = Date.now();
    
    for (let i = 29; i >= 0; i--) {
      const timestamp = new Date(now - i * 2000).toLocaleTimeString();
      const value = Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * variance));
      data.push({ timestamp, value });
    }
    
    return data;
  };

  useEffect(() => {
    const initializeServices = () => {
      const mockServices: ServiceMonitor[] = [
        {
          name: "API Gateway",
          service: "nginx",
          status: "operational",
          cpu: 23.4,
          memory: 45.2,
          lastLog: "[INFO] Request processed - 200 OK - 127ms",
          icon: <Server className="h-5 w-5" />,
          uptime: "30d 14h 25m",
          cpuHistory: generateTimeSeriesData(23.4, 15),
          memoryHistory: generateTimeSeriesData(45.2, 12)
        },
        {
          name: "Database",
          service: "PostgreSQL",
          status: "operational",
          cpu: 28.3,
          memory: 52.1,
          lastLog: "[INFO] Query executed successfully - 45ms",
          icon: <Database className="h-5 w-5" />,
          uptime: "30d 14h 22m",
          cpuHistory: generateTimeSeriesData(28.3, 12),
          memoryHistory: generateTimeSeriesData(52.1, 10)
        },
        {
          name: "Analytics",
          service: "Data Pipeline",
          status: "operational",
          cpu: 18.7,
          memory: 38.4,
          lastLog: "[INFO] Analytics aggregation completed - 15.4k events",
          icon: <Activity className="h-5 w-5" />,
          uptime: "30d 14h 21m",
          cpuHistory: generateTimeSeriesData(18.7, 8),
          memoryHistory: generateTimeSeriesData(38.4, 6)
        }
      ];

      setServices(mockServices);
      setLoading(false);
    };

    // Initial load
    initializeServices();

    // Update metrics every 2 seconds with defensive programming
    intervalRef.current = setInterval(() => {
      setServices(prev => {
        // Defensive check: ensure prev is an array
        if (!Array.isArray(prev)) {
          console.warn('MonitorSection: services state is not an array, resetting to empty array');
          return [];
        }

        return prev.map(service => {
          // Defensive check: ensure service is an object
          if (!service || typeof service !== 'object') {
            console.warn('MonitorSection: invalid service object found');
            return service; // Return as-is to avoid breaking the array
          }

          const newCpu = Math.max(0, Math.min(100, (service.cpu || 0) + (Math.random() - 0.5) * 5));
          const newMemory = Math.max(0, Math.min(100, (service.memory || 0) + (Math.random() - 0.5) * 3));

          return {
            ...service,
            cpu: newCpu,
            memory: newMemory,
            cpuHistory: [
              ...(Array.isArray(service.cpuHistory) ? service.cpuHistory.slice(1) : []), 
              {
                timestamp: new Date().toLocaleTimeString(),
                value: Math.max(0, Math.min(100, newCpu + (Math.random() - 0.5) * 5))
              }
            ],
            memoryHistory: [
              ...(Array.isArray(service.memoryHistory) ? service.memoryHistory.slice(1) : []), 
              {
                timestamp: new Date().toLocaleTimeString(),
                value: Math.max(0, Math.min(100, newMemory + (Math.random() - 0.5) * 3))
              }
            ]
          };
        });
      });
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'down':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">System Monitor</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Defensive check: ensure services is always an array
  const safeServices = Array.isArray(services) ? services : [];

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <h3 className="text-lg font-semibold text-white mb-4">System Monitor</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {safeServices.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-zinc-400">No monitoring data available</p>
          </div>
        ) : (
          safeServices.map((service, index) => {
            // Defensive destructuring with fallbacks
            const {
              name = `Service ${index + 1}`,
              service: serviceName = 'Unknown',
              status = 'down',
              cpu = 0,
              memory = 0,
              lastLog = 'No logs available',
              icon = <Server className="h-5 w-5" />,
              uptime = 'Unknown',
              cpuHistory = [],
              memoryHistory = []
            } = service || {};

            return (
              <Card key={`${name}-${index}`} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/70 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        {icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium text-white">
                          {name}
                        </CardTitle>
                        <p className="text-xs text-zinc-400">{serviceName}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(status)}`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(status)}
                        <span className="capitalize">{status}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* CPU Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        CPU Usage
                      </span>
                      <span className="text-xs font-medium text-white">
                        {Number(cpu).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Number(cpu)} 
                      className="h-1.5"
                    />
                  </div>

                  {/* Memory Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        Memory Usage
                      </span>
                      <span className="text-xs font-medium text-white">
                        {Number(memory).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Number(memory)} 
                      className="h-1.5"
                    />
                  </div>

                  {/* Mini Charts */}
                  <div className="grid grid-cols-2 gap-2 h-16">
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-500">CPU Trend</span>
                      <ResponsiveContainer width="100%" height={40}>
                        <AreaChart data={Array.isArray(cpuHistory) ? cpuHistory : []}>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.2}
                            strokeWidth={1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-500">Memory Trend</span>
                      <ResponsiveContainer width="100%" height={40}>
                        <AreaChart data={Array.isArray(memoryHistory) ? memoryHistory : []}>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            fill="#10b981" 
                            fillOpacity={0.2}
                            strokeWidth={1}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Uptime
                      </span>
                      <span className="text-zinc-300">{uptime}</span>
                    </div>
                  </div>

                  {/* Latest Log */}
                  <div className="bg-zinc-800/50 rounded p-2">
                    <div className="flex items-start gap-2">
                      <Terminal className="h-3 w-3 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                        {lastLog}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}; 