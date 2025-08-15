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
  AlertCircle,
  Bell,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Eye,
  Settings,
  Filter,
  MoreHorizontal,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
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

// Notification types and interfaces
interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  priority: "low" | "medium" | "high" | "critical";
  status: "unread" | "read" | "archived";
  category: "system" | "security" | "user" | "campaign" | "maintenance";
  created_at: string;
  read_at?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

interface NotificationAction {
  label: string;
  action: string;
  variant?: "default" | "destructive" | "outline";
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  desktop_notifications: boolean;
  notification_frequency: "instant" | "hourly" | "daily" | "weekly";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  categories: {
    system: boolean;
    security: boolean;
    user: boolean;
    campaign: boolean;
    maintenance: boolean;
  };
}

interface NotificationStats {
  total_notifications: number;
  unread_notifications: number;
  critical_notifications: number;
  notifications_today: number;
  response_rate: number;
}

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // Form state for notification creation
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as const,
    priority: "medium" as const,
    category: "system" as const,
  });

  // Mock data for demonstration
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockNotifications: SystemNotification[] = [
        {
          id: "1",
          title: "System Maintenance Scheduled",
          message: "Scheduled maintenance window from 2:00 AM to 4:00 AM UTC on Sunday",
          type: "warning",
          priority: "high",
          status: "unread",
          category: "maintenance",
          created_at: "2024-01-30T10:00:00Z",
          actions: [
            { label: "View Details", action: "view_maintenance", variant: "outline" },
            { label: "Acknowledge", action: "acknowledge", variant: "default" },
          ],
        },
        {
          id: "2",
          title: "Security Alert: Multiple Failed Login Attempts",
          message: "User account admin@example.com has 5 failed login attempts in the last hour",
          type: "error",
          priority: "critical",
          status: "unread",
          category: "security",
          created_at: "2024-01-30T09:45:00Z",
          actions: [
            { label: "Lock Account", action: "lock_account", variant: "destructive" },
            { label: "View Logs", action: "view_logs", variant: "outline" },
          ],
        },
        {
          id: "3",
          title: "Campaign Performance Update",
          message: "Marketing Campaign Q1-2024 has achieved 95% open rate milestone",
          type: "success",
          priority: "medium",
          status: "read",
          category: "campaign",
          created_at: "2024-01-30T08:30:00Z",
          read_at: "2024-01-30T09:00:00Z",
          actions: [
            { label: "View Campaign", action: "view_campaign", variant: "default" },
          ],
        },
        {
          id: "4",
          title: "New User Registration",
          message: "50 new users registered in the last 24 hours",
          type: "info",
          priority: "low",
          status: "read",
          category: "user",
          created_at: "2024-01-29T22:00:00Z",
          read_at: "2024-01-30T08:00:00Z",
        },
        {
          id: "5",
          title: "Database Backup Completed",
          message: "Automated database backup completed successfully at 3:00 AM",
          type: "success",
          priority: "low",
          status: "read",
          category: "system",
          created_at: "2024-01-29T21:00:00Z",
          read_at: "2024-01-30T07:30:00Z",
        },
      ];

      const mockSettings: NotificationSettings = {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        desktop_notifications: true,
        notification_frequency: "instant",
        quiet_hours_enabled: true,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        categories: {
          system: true,
          security: true,
          user: true,
          campaign: true,
          maintenance: true,
        },
      };

      const mockStats: NotificationStats = {
        total_notifications: mockNotifications.length,
        unread_notifications: mockNotifications.filter(n => n.status === "unread").length,
        critical_notifications: mockNotifications.filter(n => n.priority === "critical").length,
        notifications_today: mockNotifications.filter(n => {
          const today = new Date().toDateString();
          return new Date(n.created_at).toDateString() === today;
        }).length,
        response_rate: 87.5,
      };

      setNotifications(mockNotifications);
      setSettings(mockSettings);
      setStats(mockStats);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus;
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Handle notification creation
  const handleCreateNotification = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newNotification: SystemNotification = {
        id: Date.now().toString(),
        ...formData,
        status: "unread",
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [newNotification, ...prev]);
      setIsCreateDialogOpen(false);
      setFormData({ title: "", message: "", type: "info", priority: "medium", category: "system" });
      toast.success("Notification created successfully!");
    } catch (error) {
      toast.error("Failed to create notification");
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: "read" as const, read_at: new Date().toISOString() }
          : n
      ));
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  // Handle notification deletion
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success("Notification deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  // Handle settings update
  const handleUpdateSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsSettingsDialogOpen(false);
      toast.success("Notification settings updated!");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  // Get type icon and color
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "info": default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-muted text-foreground border-border";
    }
  };

  // Get category badge color
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "security": return "bg-red-100 text-red-800 border-red-200";
      case "system": return "bg-blue-100 text-blue-800 border-blue-200";
      case "user": return "bg-green-100 text-green-800 border-green-200";
      case "campaign": return "bg-purple-100 text-purple-800 border-purple-200";
      case "maintenance": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-muted text-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
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
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-30"
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
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
      </div>

      <div className="relative container mx-auto px-6 py-8">
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
                Notifications
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground mt-2 text-lg"
              >
                System alerts, notifications, and communication management
              </motion.p>
            </div>
            
            <motion.div variants={itemVariants} className="flex gap-3">
              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                    <DialogDescription>
                      Configure how and when you receive notifications
                    </DialogDescription>
                  </DialogHeader>
                  {settings && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-4">Delivery Methods</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>Email Notifications</span>
                            </div>
                            <Switch
                              checked={settings.email_notifications}
                              onCheckedChange={(checked) => 
                                setSettings(prev => prev ? { ...prev, email_notifications: checked } : null)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span>Push Notifications</span>
                            </div>
                            <Switch
                              checked={settings.push_notifications}
                              onCheckedChange={(checked) => 
                                setSettings(prev => prev ? { ...prev, push_notifications: checked } : null)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                              <span>Desktop Notifications</span>
                            </div>
                            <Switch
                              checked={settings.desktop_notifications}
                              onCheckedChange={(checked) => 
                                setSettings(prev => prev ? { ...prev, desktop_notifications: checked } : null)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Categories</h4>
                        <div className="space-y-3">
                          {Object.entries(settings.categories).map(([category, enabled]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="capitalize">{category}</span>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) => 
                                  setSettings(prev => prev ? {
                                    ...prev,
                                    categories: { ...prev.categories, [category]: checked }
                                  } : null)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Frequency</h4>
                        <Select 
                          value={settings.notification_frequency} 
                          onValueChange={(value: unknown) => 
                            setSettings(prev => prev ? { ...prev, notification_frequency: value } : null)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Instant</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
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

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div variants={floatingVariants} whileHover="hover">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Notification
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Notification</DialogTitle>
                    <DialogDescription>
                      Send a system-wide notification to administrators
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notification-title">Title</Label>
                      <Input
                        id="notification-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter notification title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notification-message">Message</Label>
                      <Textarea
                        id="notification-message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Enter notification message"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="notification-type">Type</Label>
                        <Select value={formData.type} onValueChange={(value: unknown) => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notification-priority">Priority</Label>
                        <Select value={formData.priority} onValueChange={(value: unknown) => setFormData(prev => ({ ...prev, priority: value }))}>
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
                        <Label htmlFor="notification-category">Category</Label>
                        <Select value={formData.category} onValueChange={(value: unknown) => setFormData(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="campaign">Campaign</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNotification}>
                      Create Notification
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{stats.total_notifications}</p>
                    </div>
                    <Bell className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Unread</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.unread_notifications}</p>
                    </div>
                    <motion.div variants={pulseVariants} animate="pulse">
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
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
                      <p className="text-sm font-medium text-muted-foreground">Critical</p>
                      <p className="text-2xl font-bold text-red-600">{stats.critical_notifications}</p>
                    </div>
                    <motion.div variants={pulseVariants} animate={stats.critical_notifications > 0 ? "pulse" : "initial"}>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
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
                      <p className="text-sm font-medium text-muted-foreground">Today</p>
                      <p className="text-2xl font-bold text-green-600">{stats.notifications_today}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.response_rate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
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
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Center
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage system notifications and alerts
                  </CardDescription>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search notifications..."
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
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={`transition-all hover:shadow-md ${
                        notification.status === "unread" 
                          ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50" 
                          : "border-l-4 border-l-transparent"
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium truncate">{notification.title}</h4>
                                  <Badge className={getPriorityBadgeColor(notification.priority)}>
                                    {notification.priority}
                                  </Badge>
                                  <Badge className={getCategoryBadgeColor(notification.category)}>
                                    {notification.category}
                                  </Badge>
                                  {notification.status === "unread" && (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-sm mb-3">{notification.message}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(notification.created_at).toLocaleString()}
                                  </div>
                                  {notification.read_at && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Read {new Date(notification.read_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                {notification.actions && notification.actions.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {notification.actions.map((action, actionIndex) => (
                                      <Button
                                        key={actionIndex}
                                        variant={action.variant || "outline"}
                                        size="sm"
                                        onClick={() => toast.info(`Action: ${action.label}`)}
                                      >
                                        {action.label}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {notification.status === "unread" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No notifications found matching your search." : "No notifications found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminNotifications;