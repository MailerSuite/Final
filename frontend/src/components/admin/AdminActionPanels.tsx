/**
 * Advanced Admin Action Panels with Missing Functionality
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AdminAPI, BulkOperation } from '@/api/admin-services';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  RefreshCw,
  Shield,
  Settings,
  Bell,
  Database,
  Mail,
  Users,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Archive,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  HardDrive,
  CloudDownload,
  FileText,
  Eye,
  Search,
  Filter
} from 'lucide-react';

interface ActionButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  loading?: boolean;
  disabled?: boolean;
  badge?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'default',
  loading = false,
  disabled = false,
  badge
}) => {
  const variants = {
    default: 'hover:bg-primary hover:text-primary-foreground',
    destructive: 'hover:bg-destructive hover:text-destructive-foreground',
    success: 'hover:bg-green-600 hover:text-white',
    warning: 'hover:bg-yellow-600 hover:text-white'
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <Card className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md relative",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              ) : (
                icon
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{title}</h4>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={action}
                disabled={disabled || loading}
                className={cn("w-full mt-2 text-xs", variants[variant])}
              >
                {loading ? 'Processing...' : 'Execute'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const SystemMaintenancePanel: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Fetch maintenance mode status on component mount
  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const { enabled } = await AdminAPI.maintenance.getMaintenanceMode();
        setMaintenanceMode(enabled);
      } catch (error) {
        console.error('Failed to fetch maintenance mode:', error);
      }
    };

    fetchMaintenanceMode();
  }, []);

  const executeAction = async (actionId: string, action: () => Promise<void> | BulkOperation) => {
    setLoadingStates(prev => ({ ...prev, [actionId]: true }));
    try {
      const result = await action();
      if (result && typeof result === 'object' && 'id' in result) {
        toast.success(`Operation started: ${actionId}`, {
          description: `Operation ID: ${result.id}`
        });
      } else {
        toast.success(`${actionId} completed successfully`);
      }
    } catch (error) {
      console.error(`Failed to execute ${actionId}:`, error);
      toast.error(`Failed to execute ${actionId}`, {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const handleMaintenanceModeToggle = async (enabled: boolean) => {
    try {
      await AdminAPI.maintenance.toggleMaintenanceMode(enabled, 
        enabled ? 'System maintenance in progress' : undefined
      );
      setMaintenanceMode(enabled);
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
      toast.error('Failed to toggle maintenance mode');
    }
  };

  const maintenanceActions = [
    {
      id: 'backup',
      title: 'Create System Backup',
      description: 'Full database and file system backup',
      icon: <Download className="h-5 w-5 text-blue-500" />,
      action: () => AdminAPI.maintenance.createBackup('full'),
      variant: 'default' as const
    },
    {
      id: 'cache',
      title: 'Clear System Cache',
      description: 'Clear all cached data and restart services',
      icon: <RefreshCw className="h-5 w-5 text-purple-500" />,
      action: async () => {
        await AdminAPI.maintenance.clearCache();
        return undefined;
      },
      variant: 'default' as const
    },
    {
      id: 'restart',
      title: 'Restart Services',
      description: 'Restart all system services safely',
      icon: <RotateCcw className="h-5 w-5 text-orange-500" />,
      action: async () => {
        await AdminAPI.maintenance.restartServices();
        return undefined;
      },
      variant: 'warning' as const
    },
    {
      id: 'cleanup',
      title: 'Cleanup Temp Files',
      description: 'Remove temporary files and logs',
      icon: <Trash2 className="h-5 w-5 text-red-500" />,
      action: async () => {
        await AdminAPI.maintenance.cleanupTempFiles();
        return undefined;
      },
      variant: 'destructive' as const
    },
    {
      id: 'optimize',
      title: 'Optimize Database',
      description: 'Optimize and rebuild database indexes',
      icon: <Database className="h-5 w-5 text-green-500" />,
      action: () => AdminAPI.maintenance.optimizeDatabase(),
      variant: 'success' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            System Maintenance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="maintenance-mode" className="text-sm">
              Maintenance Mode
            </Label>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={handleMaintenanceModeToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {maintenanceMode && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System is in maintenance mode. Users may experience limited functionality.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {maintenanceActions.map((action) => (
            <ActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              variant={action.variant}
              loading={loadingStates[action.id]}
              action={() => executeAction(action.id, action.action)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const BulkOperationsPanel: React.FC = () => {
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const bulkOperations = [
    {
      id: 'users-export',
      title: 'Export User Data',
      description: 'Export all user data to CSV/JSON',
      icon: <CloudDownload className="h-5 w-5 text-blue-500" />,
      badge: '1,247 users',
      action: () => AdminAPI.users.exportUsers('csv')
    },
    {
      id: 'users-cleanup',
      title: 'Cleanup Inactive Users',
      description: 'Remove users inactive for 6+ months',
      icon: <Users className="h-5 w-5 text-orange-500" />,
      badge: '47 inactive',
      variant: 'warning' as const,
      action: () => AdminAPI.users.cleanupInactiveUsers(6)
    },
    {
      id: 'data-archive',
      title: 'Archive Old Data',
      description: 'Archive data older than 2 years',
      icon: <Archive className="h-5 w-5 text-purple-500" />,
      badge: '2.4GB',
      action: async () => {
        // This would be a custom archive operation
        toast.info('Archive operation initiated');
        return { id: 'archive-' + Date.now() } as BulkOperation;
      }
    },
    {
      id: 'generate-report',
      title: 'Generate Analytics Report',
      description: 'Create comprehensive system report',
      icon: <FileText className="h-5 w-5 text-green-500" />,
      badge: 'PDF/CSV',
      action: () => AdminAPI.analytics.generateReport('daily', 'pdf')
    }
  ];

  const handleBulkOperation = (operationId: string) => {
    setSelectedOperation(operationId);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Bulk Operations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bulkOperations.map((operation) => (
            <ActionButton
              key={operation.id}
              title={operation.title}
              description={operation.description}
              icon={operation.icon}
              variant={operation.variant}
              badge={operation.badge}
              action={() => handleBulkOperation(operation.id)}
            />
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Operation</DialogTitle>
              <DialogDescription>
                This operation will affect multiple records. Please confirm to proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. Please ensure you have a recent backup.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="confirmation">Type "CONFIRM" to proceed:</Label>
                <Input id="confirmation" placeholder="CONFIRM" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive">
                Execute Operation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export const MonitoringControlsPanel: React.FC = () => {
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [reportFrequency, setReportFrequency] = useState('daily');

  const monitoringActions = [
    {
      id: 'view-logs',
      title: 'View System Logs',
      description: 'Real-time system logs and events',
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      action: () => window.location.href = '/admin/logs'
    },
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Generate performance analysis',
      icon: <Activity className="h-5 w-5 text-green-500" />,
      action: () => console.log('Performance report generated')
    },
    {
      id: 'health-check',
      title: 'Health Check',
      description: 'Run comprehensive system check',
      icon: <CheckCircle className="h-5 w-5 text-purple-500" />,
      action: () => console.log('Health check initiated')
    },
    {
      id: 'search-logs',
      title: 'Search Logs',
      description: 'Search through historical logs',
      icon: <Search className="h-5 w-5 text-orange-500" />,
      action: () => console.log('Log search opened')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Monitoring & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monitoring Settings */}
        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Real-time Monitoring</Label>
            <Switch
              checked={monitoringEnabled}
              onCheckedChange={setMonitoringEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Alert Notifications</Label>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Report Frequency</Label>
            <select 
              className="w-full p-2 border rounded text-sm"
              value={reportFrequency}
              onChange={(e) => setReportFrequency(e.target.value)}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {monitoringActions.map((action) => (
            <ActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              action={action.action}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};