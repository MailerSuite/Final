"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button
} from "@/components/ui/button";
import {
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import {
  Textarea
} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge
} from "@/components/ui/badge";
import {
  Switch
} from "@/components/ui/switch";
import {
  Progress
} from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Wrench,
  Power,
  PowerOff,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Database,
  Server,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  Plus,
  Edit,
  RefreshCw,
  Gauge,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Timer,
  Shield,
  Globe,
  Search,
  Filter,
  Eye,
  Download,
  Upload,
  Terminal,
  GitBranch,
  History,
} from "lucide-react";
import { toast } from "sonner";

// Enhanced animation variants following SGPT design system
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

const floatingVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.05,
    rotate: 2,
    transition: { duration: 0.2 },
  },
};

const pulseVariants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Maintenance types and interfaces
interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  type: "database" | "server" | "application" | "security" | "infrastructure";
  priority: "low" | "medium" | "high" | "critical";
  affected_services: string[];
  estimated_downtime: number; // in minutes
  actual_downtime?: number;
  created_by: string;
  created_at: string;
  completion_notes?: string;
}

interface SystemTask {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  type: "cleanup" | "optimization" | "update" | "backup" | "restart";
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  estimated_duration: number; // in minutes
}

interface MaintenanceSettings {
  maintenance_mode_enabled: boolean;
  auto_maintenance_enabled: boolean;
  maintenance_window_start: string;
  maintenance_window_end: string;
  allowed_ips: string[];
  maintenance_message: string;
  notification_enabled: boolean;
  emergency_contacts: string[];
}

interface MaintenanceStats {
  total_maintenance_windows: number;
  completed_windows: number;
  average_downtime: number;
  system_uptime: number;
  last_maintenance: string;
  next_scheduled: string;
  active_tasks: number;
}

const AdminMaintenance: React.FC = () => {
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [systemTasks, setSystemTasks] = useState<SystemTask[]>([]);
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateWindowDialogOpen, setIsCreateWindowDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState<MaintenanceWindow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Form state for maintenance window creation
  const [windowFormData, setWindowFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    type: "application" as const,
    priority: "medium" as const,
    affected_services: [] as string[],
    estimated_downtime: 30,
  });

  // Mock data for demonstration
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));

      const mockWindows: MaintenanceWindow[] = [
        {
          id: "1",
          title: "Database Optimization",
          description: "Monthly database maintenance and optimization tasks",
          start_time: "2024-02-04T02:00:00Z",
          end_time: "2024-02-04T04:00:00Z",
          status: "scheduled",
          type: "database",
          priority: "high",
          affected_services: ["Database", "API", "Dashboard"],
          estimated_downtime: 120,
          created_by: "system@sgpt.com",
          created_at: "2024-01-30T10:00:00Z",
        },
        {
          id: "2",
          title: "Security Patch Deployment",
          description: "Critical security updates for server infrastructure",
          start_time: "2024-01-29T01:00:00Z",
          end_time: "2024-01-29T02:30:00Z",
          status: "completed",
          type: "security",
          priority: "critical",
          affected_services: ["All Services"],
          estimated_downtime: 90,
          actual_downtime: 85,
          created_by: "admin@sgpt.com",
          created_at: "2024-01-28T14:00:00Z",
          completion_notes: "All security patches applied successfully. System performance improved by 12%.",
        },
        {
          id: "3",
          title: "Load Balancer Update",
          description: "Upgrading load balancer configuration for better performance",
          start_time: "2024-01-30T14:00:00Z",
          end_time: "2024-01-30T14:30:00Z",
          status: "active",
          type: "infrastructure",
          priority: "medium",
          affected_services: ["Load Balancer", "API Gateway"],
          estimated_downtime: 30,
          created_by: "devops@sgpt.com",
          created_at: "2024-01-30T09:00:00Z",
        },
      ];

      const mockTasks: SystemTask[] = [
        {
          id: "task1",
          name: "Cache Cleanup",
          description: "Clear system caches and temporary files",
          status: "running",
          progress: 65,
          type: "cleanup",
          started_at: "2024-01-30T14:15:00Z",
          estimated_duration: 10,
        },
        {
          id: "task2",
          name: "Database Optimization",
          description: "Optimize database queries and rebuild indexes",
          status: "completed",
          progress: 100,
          type: "optimization",
          started_at: "2024-01-30T13:00:00Z",
          completed_at: "2024-01-30T13:45:00Z",
          estimated_duration: 45,
        },
        {
          id: "task3",
          name: "Log Rotation",
          description: "Rotate and archive system logs",
          status: "pending",
          progress: 0,
          type: "cleanup",
          estimated_duration: 5,
        },
        {
          id: "task4",
          name: "Service Restart",
          description: "Restart email processing services",
          status: "failed",
          progress: 30,
          type: "restart",
          started_at: "2024-01-30T12:00:00Z",
          estimated_duration: 15,
          error_message: "Service dependency check failed",
        },
      ];

      const mockSettings: MaintenanceSettings = {
        maintenance_mode_enabled: false,
        auto_maintenance_enabled: true,
        maintenance_window_start: "02:00",
        maintenance_window_end: "06:00",
        allowed_ips: ["192.168.1.100", "10.0.0.0/8"],
        maintenance_message: "SGPT is currently undergoing scheduled maintenance. We'll be back shortly!",
        notification_enabled: true,
        emergency_contacts: ["admin@sgpt.com", "devops@sgpt.com"],
      };

      const mockStats: MaintenanceStats = {
        total_maintenance_windows: mockWindows.length,
        completed_windows: mockWindows.filter(w => w.status === "completed").length,
        average_downtime: 75, // minutes
        system_uptime: 99.8, // percentage
        last_maintenance: "2024-01-29T01:00:00Z",
        next_scheduled: "2024-02-04T02:00:00Z",
        active_tasks: mockTasks.filter(t => t.status === "running").length,
      };

      setMaintenanceWindows(mockWindows);
      setSystemTasks(mockTasks);
      setSettings(mockSettings);
      setStats(mockStats);
      setMaintenanceMode(mockSettings.maintenance_mode_enabled);
      setLoading(false);
    };

    fetchMaintenanceData();
  }, []);

  // Simulate task progress
  useEffect(() => {
    const runningTasks = systemTasks.filter(t => t.status === "running");
    if (runningTasks.length > 0) {
      const interval = setInterval(() => {
        setSystemTasks(prev => prev.map(task => {
          if (task.status === "running" && task.progress < 100) {
            const newProgress = Math.min(task.progress + Math.random() * 10, 100);
            if (newProgress >= 100) {
              return {
                ...task,
                status: "completed" as const,
                progress: 100,
                completed_at: new Date().toISOString(),
              };
            }
            return { ...task, progress: newProgress };
          }
          return task;
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [systemTasks]);

  // Filter maintenance windows
  const filteredWindows = maintenanceWindows.filter(window => {
    const matchesSearch = window.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      window.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || window.type === filterType;
    const matchesStatus = filterStatus === "all" || window.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle maintenance window creation
  const handleCreateWindow = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newWindow: MaintenanceWindow = {
        id: Date.now().toString(),
        ...windowFormData,
        status: "scheduled",
        created_by: "admin@sgpt.com",
        created_at: new Date().toISOString(),
      };

      setMaintenanceWindows(prev => [newWindow, ...prev]);
      setIsCreateWindowDialogOpen(false);
      setWindowFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        type: "application",
        priority: "medium",
        affected_services: [],
        estimated_downtime: 30,
      });
      toast.success("Maintenance window scheduled!");
    } catch (error) {
      toast.error("Failed to create maintenance window");
    }
  };

  // Handle maintenance mode toggle
  const handleToggleMaintenanceMode = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMode = !maintenanceMode;
      setMaintenanceMode(newMode);

      if (settings) {
        setSettings(prev => prev ? { ...prev, maintenance_mode_enabled: newMode } : null);
      }

      toast.success(newMode ? "Maintenance mode enabled" : "Maintenance mode disabled");
    } catch (error) {
      toast.error("Failed to toggle maintenance mode");
    }
  };

  // Handle system task execution
  const handleExecuteTask = async (taskId: string) => {
    try {
      setSystemTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status: "running" as const, progress: 0, started_at: new Date().toISOString() }
          : task
      ));
      toast.success("Task started successfully!");
    } catch (error) {
      toast.error("Failed to start task");
    }
  };

  // Handle settings update
  const handleUpdateSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsSettingsDialogOpen(false);
      toast.success("Maintenance settings updated!");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30";
      case "active": case "running": return "bg-primary/20 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-700/30";
      case "scheduled": case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/30";
      case "cancelled": case "failed": return "bg-destructive/20 text-destructive-800 dark:text-destructive-300 border-destructive-200 dark:border-destructive-700/30";
      default: return "bg-muted text-foreground border-border";
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-destructive/20 text-destructive-800 dark:text-destructive-300 border-destructive-200 dark:border-destructive-700/30";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/30";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700/30";
      case "low": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30";
      default: return "bg-muted text-foreground border-border";
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "database": return <Database className="h-4 w-4" />;
      case "server": return <Server className="h-4 w-4" />;
      case "security": return <Shield className="h-4 w-4" />;
      case "infrastructure": return <Network className="h-4 w-4" />;
      case "application": default: return <Wrench className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-muted/20 to-muted/30 dark:from-slate-950 dark:via-muted/20 dark:to-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-muted/20 to-muted/30 dark:from-slate-950 dark:via-muted/20 dark:to-muted/30">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 dark:bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-muted/20 dark:bg-muted/10 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
      </div>

      <div className="relative container mx-auto px-6 py-8">
        {/* Maintenance Mode Banner */}
        {maintenanceMode && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div variants={pulseVariants} animate="pulse">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                        Maintenance Mode Active
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        System is currently in maintenance mode. Only administrators can access the application.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMaintenanceMode}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Disable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                variants={itemVariants}
                className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
              >
                Maintenance Center
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground mt-2 text-lg"
              >
                System maintenance, monitoring, and operational controls
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={maintenanceMode ? "destructive" : "outline"}
                    size="sm"
                  >
                    {maintenanceMode ? <PowerOff className="w-4 h-4 mr-2" /> : <Power className="w-4 h-4 mr-2" />}
                    {maintenanceMode ? "Disable" : "Enable"} Maintenance Mode
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {maintenanceMode ? "Disable" : "Enable"} Maintenance Mode
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {maintenanceMode
                        ? "This will allow all users to access the application normally."
                        : "This will restrict access to administrators only. Regular users will see a maintenance message."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleMaintenanceMode}>
                      {maintenanceMode ? "Disable" : "Enable"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Maintenance Settings</DialogTitle>
                    <DialogDescription>
                      Configure maintenance mode and automation settings
                    </DialogDescription>
                  </DialogHeader>
                  {settings && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-4">Automation</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Enable Auto Maintenance</span>
                            <Switch
                              checked={settings.auto_maintenance_enabled}
                              onCheckedChange={(checked) =>
                                setSettings(prev => prev ? { ...prev, auto_maintenance_enabled: checked } : null)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Maintenance Window Start</Label>
                              <Input
                                type="time"
                                value={settings.maintenance_window_start}
                                onChange={(e) =>
                                  setSettings(prev => prev ? { ...prev, maintenance_window_start: e.target.value } : null)
                                }
                              />
                            </div>
                            <div>
                              <Label>Maintenance Window End</Label>
                              <Input
                                type="time"
                                value={settings.maintenance_window_end}
                                onChange={(e) =>
                                  setSettings(prev => prev ? { ...prev, maintenance_window_end: e.target.value } : null)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Maintenance Message</h4>
                        <Textarea
                          value={settings.maintenance_message}
                          onChange={(e) =>
                            setSettings(prev => prev ? { ...prev, maintenance_message: e.target.value } : null)
                          }
                          placeholder="Enter maintenance message for users"
                          rows={3}
                        />
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Access Control</h4>
                        <div>
                          <Label>Allowed IP Addresses (comma-separated)</Label>
                          <Input
                            value={settings.allowed_ips.join(", ")}
                            onChange={(e) =>
                              setSettings(prev => prev ? {
                                ...prev,
                                allowed_ips: e.target.value.split(",").map(ip => ip.trim())
                              } : null)
                            }
                            placeholder="192.168.1.100, 10.0.0.0/8"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateSettings}>
                      Save Settings
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateWindowDialogOpen} onOpenChange={setIsCreateWindowDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div variants={floatingVariants} whileHover="hover">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Maintenance
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule Maintenance Window</DialogTitle>
                    <DialogDescription>
                      Plan a maintenance window for system updates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="window-title">Title</Label>
                      <Input
                        id="window-title"
                        value={windowFormData.title}
                        onChange={(e) => setWindowFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter maintenance title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="window-description">Description</Label>
                      <Textarea
                        id="window-description"
                        value={windowFormData.description}
                        onChange={(e) => setWindowFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter maintenance description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="window-start">Start Time</Label>
                        <Input
                          id="window-start"
                          type="datetime-local"
                          value={windowFormData.start_time}
                          onChange={(e) => setWindowFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="window-end">End Time</Label>
                        <Input
                          id="window-end"
                          type="datetime-local"
                          value={windowFormData.end_time}
                          onChange={(e) => setWindowFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="window-type">Type</Label>
                        <Select value={windowFormData.type} onValueChange={(value: any) => setWindowFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="application">Application</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="server">Server</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="window-priority">Priority</Label>
                        <Select value={windowFormData.priority} onValueChange={(value: any) => setWindowFormData(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="window-downtime">Est. Downtime (min)</Label>
                        <Input
                          id="window-downtime"
                          type="number"
                          value={windowFormData.estimated_downtime}
                          onChange={(e) => setWindowFormData(prev => ({ ...prev, estimated_downtime: parseInt(e.target.value) }))}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateWindowDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWindow}>
                      Schedule Maintenance
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                      <p className="text-2xl font-bold text-green-600">{stats.system_uptime}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.active_tasks}</p>
                    </div>
                    <motion.div
                      variants={stats.active_tasks > 0 ? pulseVariants : { initial: { scale: 1 } }}
                      animate={stats.active_tasks > 0 ? "pulse" : "initial"}
                    >
                      <Activity className="h-8 w-8 text-blue-500" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Downtime</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.average_downtime}m</p>
                    </div>
                    <Timer className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.completed_windows}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Tabs defaultValue="windows" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="windows">Maintenance Windows</TabsTrigger>
              <TabsTrigger value="tasks">System Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="windows">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Maintenance Windows
                      </CardTitle>
                      <CardDescription>
                        Scheduled and completed maintenance activities
                      </CardDescription>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search windows..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>

                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="application">Application</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredWindows.map((window, index) => (
                        <motion.div
                          key={window.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="mt-1">
                                    {getTypeIcon(window.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium truncate">{window.title}</h4>
                                      <Badge className={getStatusBadgeColor(window.status)}>
                                        {window.status}
                                      </Badge>
                                      <Badge className={getPriorityBadgeColor(window.priority)}>
                                        {window.priority}
                                      </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm mb-3">{window.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(window.start_time).toLocaleString()} - {new Date(window.end_time).toLocaleString()}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        Est. {window.estimated_downtime}m downtime
                                      </div>
                                      {window.actual_downtime && (
                                        <div className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Actual: {window.actual_downtime}m
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-muted-foreground">Affected:</span>
                                      {window.affected_services.map((service, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {service}
                                        </Badge>
                                      ))}
                                    </div>
                                    {window.completion_notes && (
                                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/50 rounded text-sm">
                                        <strong>Completion Notes:</strong> {window.completion_notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {window.status === "scheduled" && (
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {filteredWindows.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "No maintenance windows found matching your search." : "No maintenance windows scheduled."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    System Tasks
                  </CardTitle>
                  <CardDescription>
                    Monitor and execute system maintenance tasks
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {systemTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{task.name}</h4>
                                    <Badge className={getStatusBadgeColor(task.status)}>
                                      {task.status}
                                    </Badge>
                                    <Badge variant="outline">
                                      {task.type}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground text-sm mb-3">{task.description}</p>

                                  {task.status === "running" && (
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-muted-foreground">Progress</span>
                                        <span className="text-sm font-medium">{Math.round(task.progress)}%</span>
                                      </div>
                                      <Progress value={task.progress} className="h-2" />
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      Est. {task.estimated_duration}m
                                    </div>
                                    {task.started_at && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Started: {new Date(task.started_at).toLocaleString()}
                                      </div>
                                    )}
                                    {task.completed_at && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Completed: {new Date(task.completed_at).toLocaleString()}
                                      </div>
                                    )}
                                  </div>

                                  {task.error_message && (
                                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/50 rounded text-sm text-red-700 dark:text-red-300">
                                      <strong>Error:</strong> {task.error_message}
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  {task.status === "pending" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleExecuteTask(task.id)}
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {task.status === "running" && (
                                    <Button variant="outline" size="sm" disabled>
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                      >
                                        <RefreshCw className="h-4 w-4" />
                                      </motion.div>
                                    </Button>
                                  )}
                                  {(task.status === "failed" || task.status === "completed") && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleExecuteTask(task.id)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {systemTasks.length === 0 && (
                    <div className="text-center py-8">
                      <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No system tasks available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminMaintenance;