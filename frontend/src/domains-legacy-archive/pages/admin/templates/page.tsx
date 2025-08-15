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
  Mail,
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Settings,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  Palette,
  Code,
  Zap,
  Users,
  BarChart3,
  Calendar,
  Clock,
  Star,
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

// Template types and interfaces
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: "welcome" | "marketing" | "notification" | "transactional";
  status: "active" | "draft" | "archived";
  usage_count: number;
  created_at: string;
  updated_at: string;
  variables: string[];
  preview_url?: string;
}

interface TemplateStats {
  total_templates: number;
  active_templates: number;
  draft_templates: number;
  total_usage: number;
  popular_templates: EmailTemplate[];
}

const AdminTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state for template creation/editing
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    type: "marketing" as const,
    variables: [] as string[],
  });

  // Mock data for demonstration
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTemplates: EmailTemplate[] = [
        {
          id: "1",
          name: "Welcome Email",
          subject: "Welcome to SGPT - Get Started!",
          content: "Welcome {{name}}! We're excited to have you on board...",
          type: "welcome",
          status: "active",
          usage_count: 1234,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T10:00:00Z",
          variables: ["name", "email", "company"],
        },
        {
          id: "2",
          name: "Marketing Campaign",
          subject: "🚀 Boost Your Email Marketing ROI by 300%",
          content: "Dear {{name}}, discover how to triple your email marketing results...",
          type: "marketing",
          status: "active",
          usage_count: 856,
          created_at: "2024-01-10T10:00:00Z",
          updated_at: "2024-01-25T10:00:00Z",
          variables: ["name", "company", "industry"],
        },
        {
          id: "3",
          name: "Password Reset",
          subject: "Reset Your SGPT Password",
          content: "Hi {{name}}, you requested to reset your password...",
          type: "transactional",
          status: "active",
          usage_count: 423,
          created_at: "2024-01-05T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
          variables: ["name", "reset_link", "expires_at"],
        },
        {
          id: "4",
          name: "Monthly Newsletter",
          subject: "SGPT Monthly Updates & Tips",
          content: "Hello {{name}}, here's what's new this month...",
          type: "notification",
          status: "draft",
          usage_count: 0,
          created_at: "2024-01-28T10:00:00Z",
          updated_at: "2024-01-28T10:00:00Z",
          variables: ["name", "month", "highlights"],
        },
      ];

      const mockStats: TemplateStats = {
        total_templates: mockTemplates.length,
        active_templates: mockTemplates.filter(t => t.status === "active").length,
        draft_templates: mockTemplates.filter(t => t.status === "draft").length,
        total_usage: mockTemplates.reduce((sum, t) => sum + t.usage_count, 0),
        popular_templates: mockTemplates.slice(0, 3),
      };

      setTemplates(mockTemplates);
      setStats(mockStats);
      setLoading(false);
    };

    fetchTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || template.type === filterType;
    const matchesStatus = filterStatus === "all" || template.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle template creation
  const handleCreateTemplate = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        ...formData,
        status: "draft",
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setTemplates(prev => [newTemplate, ...prev]);
      setIsCreateDialogOpen(false);
      setFormData({ name: "", subject: "", content: "", type: "marketing", variables: [] });
      toast.success("Template created successfully!");
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  // Handle template editing
  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedTemplate = {
        ...selectedTemplate,
        ...formData,
        updated_at: new Date().toISOString(),
      };

      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? updatedTemplate : t));
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      setFormData({ name: "", subject: "", content: "", type: "marketing", variables: [] });
      toast.success("Template updated successfully!");
    } catch (error) {
      toast.error("Failed to update template");
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success("Template deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "welcome": return "bg-green-100 text-green-800 border-green-200";
      case "marketing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "notification": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "transactional": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-muted text-foreground border-border";
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "draft": return "bg-muted text-foreground border-border";
      case "archived": return "bg-red-100 text-red-800 border-red-200";
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
                Email Templates
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground mt-2 text-lg"
              >
                Manage and customize email templates for your campaigns
              </motion.p>
            </div>
            
            <motion.div variants={itemVariants} className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div variants={floatingVariants} whileHover="hover">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                      Design a new email template for your campaigns
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-subject">Email Subject</Label>
                      <Input
                        id="template-subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter email subject line"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-type">Template Type</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                          <SelectItem value="transactional">Transactional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="template-content">Email Content</Label>
                      <Textarea
                        id="template-content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter email template content..."
                        rows={8}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Create Template
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
                      <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                      <p className="text-2xl font-bold">{stats.total_templates}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                      <p className="text-2xl font-bold text-green-600">{stats.active_templates}</p>
                    </div>
                    <Zap className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Draft Templates</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.draft_templates}</p>
                    </div>
                    <Edit className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.total_usage.toLocaleString()}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
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
                    <Mail className="h-5 w-5" />
                    Template Management
                  </CardTitle>
                  <CardDescription>
                    Create, edit, and manage your email templates
                  </CardDescription>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search templates..."
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
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredTemplates.map((template, index) => (
                        <motion.tr
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {template.subject}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeBadgeColor(template.type)}>
                              {template.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(template.status)}>
                              {template.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {template.usage_count.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {new Date(template.updated_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setFormData({
                                    name: template.name,
                                    subject: template.subject,
                                    content: template.content,
                                    type: template.type,
                                    variables: template.variables,
                                  });
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No templates found matching your search." : "No templates found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Template Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update your email template configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input
                  id="edit-template-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit-template-subject">Email Subject</Label>
                <Input
                  id="edit-template-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject line"
                />
              </div>
              <div>
                <Label htmlFor="edit-template-type">Template Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-template-content">Email Content</Label>
                <Textarea
                  id="edit-template-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter email template content..."
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTemplate}>
                Update Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminTemplates;