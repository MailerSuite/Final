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
  ArrowUpDown,
  Download,
  Upload,
  FileDown,
  FileUp,
  File,
  Database,
  Users,
  Mail,
  Settings,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  Filter,
  Search,
  FileText,
  Archive,
  Package,
  Globe,
  Server,
  Shield,
  Zap,
  BarChart3,
  TrendingUp,
  Activity,
  HardDrive,
  Terminal,
  Code,
  FileJson,
  FileSpreadsheet,
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

// Import/Export types and interfaces
interface ImportJob {
  id: string;
  name: string;
  type: "users" | "campaigns" | "templates" | "settings" | "analytics" | "database";
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  file_name: string;
  file_size: number;
  records_processed: number;
  records_total: number;
  created_at: string;
  completed_at?: string;
  created_by: string;
  error_message?: string;
  validation_errors?: string[];
}

interface ExportJob {
  id: string;
  name: string;
  type: "users" | "campaigns" | "templates" | "settings" | "analytics" | "database";
  format: "csv" | "json" | "xml" | "sql" | "xlsx";
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  file_path?: string;
  file_size?: number;
  records_exported: number;
  created_at: string;
  completed_at?: string;
  created_by: string;
  filters?: Record<string, any>;
  compression: boolean;
  encryption: boolean;
}

interface DataTemplate {
  id: string;
  name: string;
  type: "users" | "campaigns" | "templates" | "settings";
  description: string;
  required_fields: string[];
  optional_fields: string[];
  field_mappings: Record<string, string>;
  validation_rules: Record<string, any>;
  example_data: Record<string, any>[];
}

interface ImportStats {
  total_imports: number;
  successful_imports: number;
  failed_imports: number;
  records_imported: number;
  last_import_date: string;
}

interface ExportStats {
  total_exports: number;
  successful_exports: number;
  failed_exports: number;
  records_exported: number;
  last_export_date: string;
}

const AdminImportExport: React.FC = () => {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [templates, setTemplates] = useState<DataTemplate[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Form state for import
  const [importFormData, setImportFormData] = useState({
    name: "",
    type: "users" as const,
    template_id: "",
    validate_data: true,
    create_backup: true,
    skip_duplicates: true,
  });

  // Form state for export
  const [exportFormData, setExportFormData] = useState({
    name: "",
    type: "users" as const,
    format: "csv" as const,
    include_headers: true,
    compression: false,
    encryption: false,
    date_range_start: "",
    date_range_end: "",
    filters: {},
  });

  // Mock data for demonstration
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));

      const mockImportJobs: ImportJob[] = [
        {
          id: "imp1",
          name: "User Data Import - January 2024",
          type: "users",
          status: "completed",
          progress: 100,
          file_name: "users_january_2024.csv",
          file_size: 2048576, // 2MB
          records_processed: 1250,
          records_total: 1250,
          created_at: "2024-01-30T10:00:00Z",
          completed_at: "2024-01-30T10:15:00Z",
          created_by: "admin@sgpt.com",
        },
        {
          id: "imp2",
          name: "Campaign Templates Import",
          type: "templates",
          status: "running",
          progress: 65,
          file_name: "email_templates.json",
          file_size: 512000, // 512KB
          records_processed: 13,
          records_total: 20,
          created_at: "2024-01-30T14:00:00Z",
          created_by: "admin@sgpt.com",
        },
        {
          id: "imp3",
          name: "Legacy System Migration",
          type: "database",
          status: "failed",
          progress: 25,
          file_name: "legacy_data.sql",
          file_size: 10485760, // 10MB
          records_processed: 500,
          records_total: 2000,
          created_at: "2024-01-29T16:00:00Z",
          created_by: "admin@sgpt.com",
          error_message: "Foreign key constraint violation on table 'campaigns'",
          validation_errors: [
            "Row 501: Invalid email format",
            "Row 502: Missing required field 'name'",
            "Row 503: Duplicate primary key",
          ],
        },
      ];

      const mockExportJobs: ExportJob[] = [
        {
          id: "exp1",
          name: "Monthly User Report",
          type: "users",
          format: "xlsx",
          status: "completed",
          progress: 100,
          file_path: "/exports/users_report_january_2024.xlsx",
          file_size: 3145728, // 3MB
          records_exported: 2847,
          created_at: "2024-01-30T09:00:00Z",
          completed_at: "2024-01-30T09:12:00Z",
          created_by: "admin@sgpt.com",
          compression: true,
          encryption: false,
          filters: { active: true, plan: "premium" },
        },
        {
          id: "exp2",
          name: "Campaign Analytics Export",
          type: "analytics",
          format: "json",
          status: "running",
          progress: 45,
          records_exported: 234,
          created_at: "2024-01-30T13:30:00Z",
          created_by: "admin@sgpt.com",
          compression: false,
          encryption: true,
          filters: { date_range: "2024-01" },
        },
        {
          id: "exp3",
          name: "System Configuration Backup",
          type: "settings",
          format: "json",
          status: "completed",
          progress: 100,
          file_path: "/exports/system_config_backup.json",
          file_size: 1048576, // 1MB
          records_exported: 1,
          created_at: "2024-01-29T20:00:00Z",
          completed_at: "2024-01-29T20:02:00Z",
          created_by: "system@sgpt.com",
          compression: true,
          encryption: true,
        },
      ];

      const mockTemplates: DataTemplate[] = [
        {
          id: "tmpl1",
          name: "User Import Template",
          type: "users",
          description: "Standard template for importing user data with all required fields",
          required_fields: ["email", "name", "plan_id"],
          optional_fields: ["phone", "company", "country", "created_at"],
          field_mappings: {
            "email": "email_address",
            "name": "full_name",
            "plan_id": "subscription_plan",
          },
          validation_rules: {
            email: { type: "email", required: true },
            name: { type: "string", minLength: 2, required: true },
            plan_id: { type: "string", enum: ["free", "premium", "enterprise"], required: true },
          },
          example_data: [
            { email: "user@example.com", name: "John Doe", plan_id: "premium", company: "ACME Corp" },
            { email: "jane@example.com", name: "Jane Smith", plan_id: "free", country: "USA" },
          ],
        },
        {
          id: "tmpl2",
          name: "Campaign Template Import",
          type: "campaigns",
          description: "Template for importing email campaign data",
          required_fields: ["name", "subject", "content", "status"],
          optional_fields: ["tags", "scheduled_at", "target_list"],
          field_mappings: {
            "name": "campaign_name",
            "subject": "email_subject",
            "content": "email_content",
          },
          validation_rules: {
            name: { type: "string", minLength: 3, required: true },
            subject: { type: "string", minLength: 5, required: true },
            status: { type: "string", enum: ["draft", "scheduled", "sent"], required: true },
          },
          example_data: [
            { name: "Welcome Campaign", subject: "Welcome to SGPT!", content: "Welcome message...", status: "draft" },
          ],
        },
      ];

      const mockImportStats: ImportStats = {
        total_imports: mockImportJobs.length,
        successful_imports: mockImportJobs.filter(j => j.status === "completed").length,
        failed_imports: mockImportJobs.filter(j => j.status === "failed").length,
        records_imported: mockImportJobs.reduce((sum, j) => sum + j.records_processed, 0),
        last_import_date: "2024-01-30T10:00:00Z",
      };

      const mockExportStats: ExportStats = {
        total_exports: mockExportJobs.length,
        successful_exports: mockExportJobs.filter(j => j.status === "completed").length,
        failed_exports: mockExportJobs.filter(j => j.status === "failed").length,
        records_exported: mockExportJobs.reduce((sum, j) => sum + j.records_exported, 0),
        last_export_date: "2024-01-30T09:00:00Z",
      };

      setImportJobs(mockImportJobs);
      setExportJobs(mockExportJobs);
      setTemplates(mockTemplates);
      setImportStats(mockImportStats);
      setExportStats(mockExportStats);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Simulate job progress
  useEffect(() => {
    const runningJobs = [...importJobs.filter(j => j.status === "running"), ...exportJobs.filter(j => j.status === "running")];
    if (runningJobs.length > 0) {
      const interval = setInterval(() => {
        setImportJobs(prev => prev.map(job => {
          if (job.status === "running" && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 15, 100);
            const newRecordsProcessed = Math.floor((newProgress / 100) * job.records_total);
            if (newProgress >= 100) {
              return {
                ...job,
                status: "completed" as const,
                progress: 100,
                records_processed: job.records_total,
                completed_at: new Date().toISOString(),
              };
            }
            return { ...job, progress: newProgress, records_processed: newRecordsProcessed };
          }
          return job;
        }));

        setExportJobs(prev => prev.map(job => {
          if (job.status === "running" && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 15, 100);
            const estimatedTotal = job.records_exported / (job.progress / 100);
            const newRecordsExported = Math.floor((newProgress / 100) * estimatedTotal);
            if (newProgress >= 100) {
              return {
                ...job,
                status: "completed" as const,
                progress: 100,
                records_exported: newRecordsExported,
                completed_at: new Date().toISOString(),
                file_path: `/exports/${job.name.toLowerCase().replace(/\s+/g, '_')}.${job.format}`,
                file_size: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
              };
            }
            return { ...job, progress: newProgress, records_exported: newRecordsExported };
          }
          return job;
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [importJobs, exportJobs]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportFormData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  // Handle import job creation
  const handleCreateImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newJob: ImportJob = {
        id: Date.now().toString(),
        ...importFormData,
        status: "running",
        progress: 0,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        records_processed: 0,
        records_total: Math.floor(Math.random() * 1000) + 100,
        created_at: new Date().toISOString(),
        created_by: "admin@sgpt.com",
      };

      setImportJobs(prev => [newJob, ...prev]);
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      setImportFormData({
        name: "",
        type: "users",
        template_id: "",
        validate_data: true,
        create_backup: true,
        skip_duplicates: true,
      });
      toast.success("Import job started successfully!");
    } catch (error) {
      toast.error("Failed to start import job");
    }
  };

  // Handle export job creation
  const handleCreateExport = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newJob: ExportJob = {
        id: Date.now().toString(),
        ...exportFormData,
        status: "running",
        progress: 0,
        records_exported: 0,
        created_at: new Date().toISOString(),
        created_by: "admin@sgpt.com",
      };

      setExportJobs(prev => [newJob, ...prev]);
      setIsExportDialogOpen(false);
      setExportFormData({
        name: "",
        type: "users",
        format: "csv",
        include_headers: true,
        compression: false,
        encryption: false,
        date_range_start: "",
        date_range_end: "",
        filters: {},
      });
      toast.success("Export job started successfully!");
    } catch (error) {
      toast.error("Failed to start export job");
    }
  };

  // Handle job cancellation
  const handleCancelJob = async (jobId: string, type: "import" | "export") => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (type === "import") {
        setImportJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, status: "cancelled" as const } : job
        ));
      } else {
        setExportJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, status: "cancelled" as const } : job
        ));
      }

      toast.success("Job cancelled successfully!");
    } catch (error) {
      toast.error("Failed to cancel job");
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "running": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed": case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-muted text-foreground border-border";
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "users": return <Users className="h-4 w-4" />;
      case "campaigns": return <Mail className="h-4 w-4" />;
      case "templates": return <FileText className="h-4 w-4" />;
      case "settings": return <Settings className="h-4 w-4" />;
      case "analytics": return <BarChart3 className="h-4 w-4" />;
      case "database": return <Database className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format) {
      case "csv": return <FileText className="h-4 w-4" />;
      case "json": return <FileJson className="h-4 w-4" />;
      case "xml": return <Code className="h-4 w-4" />;
      case "sql": return <Database className="h-4 w-4" />;
      case "xlsx": return <FileSpreadsheet className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                Import & Export
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground mt-2 text-lg"
              >
                Data import, export, and migration tools for system administration
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex gap-3">
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Export Data</DialogTitle>
                    <DialogDescription>
                      Export system data in various formats
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-name">Export Name</Label>
                      <Input
                        id="export-name"
                        value={exportFormData.name}
                        onChange={(e) => setExportFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter export name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="export-type">Data Type</Label>
                        <Select value={exportFormData.type} onValueChange={(value: any) => setExportFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="users">Users</SelectItem>
                            <SelectItem value="campaigns">Campaigns</SelectItem>
                            <SelectItem value="templates">Templates</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="settings">Settings</SelectItem>
                            <SelectItem value="database">Full Database</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="export-format">Format</Label>
                        <Select value={exportFormData.format} onValueChange={(value: any) => setExportFormData(prev => ({ ...prev, format: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="xml">XML</SelectItem>
                            <SelectItem value="xlsx">Excel</SelectItem>
                            <SelectItem value="sql">SQL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="export-start">Date Range Start</Label>
                        <Input
                          id="export-start"
                          type="date"
                          value={exportFormData.date_range_start}
                          onChange={(e) => setExportFormData(prev => ({ ...prev, date_range_start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="export-end">Date Range End</Label>
                        <Input
                          id="export-end"
                          type="date"
                          value={exportFormData.date_range_end}
                          onChange={(e) => setExportFormData(prev => ({ ...prev, date_range_end: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="export-headers"
                          checked={exportFormData.include_headers}
                          onCheckedChange={(checked) => setExportFormData(prev => ({ ...prev, include_headers: checked }))}
                        />
                        <Label htmlFor="export-headers">Include Headers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="export-compression"
                          checked={exportFormData.compression}
                          onCheckedChange={(checked) => setExportFormData(prev => ({ ...prev, compression: checked }))}
                        />
                        <Label htmlFor="export-compression">Enable Compression</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="export-encryption"
                          checked={exportFormData.encryption}
                          onCheckedChange={(checked) => setExportFormData(prev => ({ ...prev, encryption: checked }))}
                        />
                        <Label htmlFor="export-encryption">Enable Encryption</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateExport}>
                      Start Export
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div variants={floatingVariants} whileHover="hover">
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                    <DialogDescription>
                      Import data from external files into the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-file">Select File</Label>
                      <Input
                        id="import-file"
                        type="file"
                        onChange={handleFileSelect}
                        accept=".csv,.json,.xml,.xlsx,.sql"
                      />
                      {selectedFile && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="import-name">Import Name</Label>
                      <Input
                        id="import-name"
                        value={importFormData.name}
                        onChange={(e) => setImportFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter import name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="import-type">Data Type</Label>
                        <Select value={importFormData.type} onValueChange={(value: any) => setImportFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="users">Users</SelectItem>
                            <SelectItem value="campaigns">Campaigns</SelectItem>
                            <SelectItem value="templates">Templates</SelectItem>
                            <SelectItem value="settings">Settings</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="import-template">Template</Label>
                        <Select value={importFormData.template_id} onValueChange={(value) => setImportFormData(prev => ({ ...prev, template_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates
                              .filter(t => t.type === importFormData.type)
                              .map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="import-validate"
                          checked={importFormData.validate_data}
                          onCheckedChange={(checked) => setImportFormData(prev => ({ ...prev, validate_data: checked }))}
                        />
                        <Label htmlFor="import-validate">Validate Data</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="import-backup"
                          checked={importFormData.create_backup}
                          onCheckedChange={(checked) => setImportFormData(prev => ({ ...prev, create_backup: checked }))}
                        />
                        <Label htmlFor="import-backup">Create Backup Before Import</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="import-skip-duplicates"
                          checked={importFormData.skip_duplicates}
                          onCheckedChange={(checked) => setImportFormData(prev => ({ ...prev, skip_duplicates: checked }))}
                        />
                        <Label htmlFor="import-skip-duplicates">Skip Duplicates</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateImport}>
                      Start Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {importStats && exportStats && (
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
                      <p className="text-sm font-medium text-muted-foreground">Total Imports</p>
                      <p className="text-2xl font-bold">{importStats.total_imports}</p>
                    </div>
                    <FileUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Exports</p>
                      <p className="text-2xl font-bold">{exportStats.total_exports}</p>
                    </div>
                    <FileDown className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Records Imported</p>
                      <p className="text-2xl font-bold text-purple-600">{importStats.records_imported.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Records Exported</p>
                      <p className="text-2xl font-bold text-orange-600">{exportStats.records_exported.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
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
          <Tabs defaultValue="imports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="imports">Import Jobs</TabsTrigger>
              <TabsTrigger value="exports">Export Jobs</TabsTrigger>
              <TabsTrigger value="templates">Data Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="imports">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileUp className="h-5 w-5" />
                        Import Jobs
                      </CardTitle>
                      <CardDescription>
                        Monitor and manage data import operations
                      </CardDescription>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search imports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>

                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="campaigns">Campaigns</SelectItem>
                          <SelectItem value="templates">Templates</SelectItem>
                          <SelectItem value="settings">Settings</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {importJobs.map((job, index) => (
                        <motion.div
                          key={job.id}
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
                                    {getTypeIcon(job.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium truncate">{job.name}</h4>
                                      <Badge className={getStatusBadgeColor(job.status)}>
                                        {job.status}
                                      </Badge>
                                      <Badge variant="outline">{job.type}</Badge>
                                    </div>

                                    <div className="text-sm text-muted-foreground mb-3">
                                      <div>File: {job.file_name} ({formatFileSize(job.file_size)})</div>
                                      <div>Progress: {job.records_processed}/{job.records_total} records</div>
                                    </div>

                                    {job.status === "running" && (
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm text-muted-foreground">Progress</span>
                                          <span className="text-sm font-medium">{Math.round(job.progress)}%</span>
                                        </div>
                                        <Progress value={job.progress} className="h-2" />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Created: {new Date(job.created_at).toLocaleString()}
                                      </div>
                                      {job.completed_at && (
                                        <div className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Completed: {new Date(job.completed_at).toLocaleString()}
                                        </div>
                                      )}
                                    </div>

                                    {job.error_message && (
                                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/50 rounded text-sm text-red-700 dark:text-red-300">
                                        <strong>Error:</strong> {job.error_message}
                                      </div>
                                    )}

                                    {job.validation_errors && job.validation_errors.length > 0 && (
                                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/50 rounded text-sm">
                                        <strong>Validation Errors:</strong>
                                        <ul className="list-disc list-inside mt-1">
                                          {job.validation_errors.slice(0, 3).map((error, i) => (
                                            <li key={i} className="text-yellow-700 dark:text-yellow-300">{error}</li>
                                          ))}
                                          {job.validation_errors.length > 3 && (
                                            <li className="text-yellow-700 dark:text-yellow-300">
                                              ... and {job.validation_errors.length - 3} more
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {job.status === "running" && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancel Import Job</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to cancel this import job? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleCancelJob(job.id, "import")}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Cancel Job
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  {(job.status === "completed" || job.status === "failed" || job.status === "cancelled") && (
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
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

                  {importJobs.length === 0 && (
                    <div className="text-center py-8">
                      <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No import jobs found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="exports">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileDown className="h-5 w-5" />
                    Export Jobs
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage data export operations
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {exportJobs.map((job, index) => (
                        <motion.div
                          key={job.id}
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
                                    {getFormatIcon(job.format)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium truncate">{job.name}</h4>
                                      <Badge className={getStatusBadgeColor(job.status)}>
                                        {job.status}
                                      </Badge>
                                      <Badge variant="outline">{job.type}</Badge>
                                      <Badge variant="outline">{job.format.toUpperCase()}</Badge>
                                    </div>

                                    <div className="text-sm text-muted-foreground mb-3">
                                      <div>Records exported: {job.records_exported.toLocaleString()}</div>
                                      {job.file_size && (
                                        <div>File size: {formatFileSize(job.file_size)}</div>
                                      )}
                                    </div>

                                    {job.status === "running" && (
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm text-muted-foreground">Progress</span>
                                          <span className="text-sm font-medium">{Math.round(job.progress)}%</span>
                                        </div>
                                        <Progress value={job.progress} className="h-2" />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Created: {new Date(job.created_at).toLocaleString()}
                                      </div>
                                      {job.completed_at && (
                                        <div className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Completed: {new Date(job.completed_at).toLocaleString()}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {job.compression && (
                                        <Badge variant="outline" className="text-xs">
                                          <Archive className="h-3 w-3 mr-1" />
                                          Compressed
                                        </Badge>
                                      )}
                                      {job.encryption && (
                                        <Badge variant="outline" className="text-xs">
                                          <Shield className="h-3 w-3 mr-1" />
                                          Encrypted
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  {job.status === "completed" && job.file_path && (
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {job.status === "running" && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancel Export Job</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to cancel this export job? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleCancelJob(job.id, "export")}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Cancel Job
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  {(job.status === "completed" || job.status === "failed" || job.status === "cancelled") && (
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
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

                  {exportJobs.length === 0 && (
                    <div className="text-center py-8">
                      <FileDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No export jobs found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-card/80 border-border/60 dark:border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Data Templates
                  </CardTitle>
                  <CardDescription>
                    Predefined templates for data import operations
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {templates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="transition-all hover:shadow-md">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="mt-1">
                                    {getTypeIcon(template.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium">{template.name}</h4>
                                      <Badge variant="outline">{template.type}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Required Fields:</span>
                                        <div className="flex gap-1 flex-wrap mt-1">
                                          {template.required_fields.map((field, i) => (
                                            <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700">
                                              {field}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="font-medium">Optional Fields:</span>
                                        <div className="flex gap-1 flex-wrap mt-1">
                                          {template.optional_fields.map((field, i) => (
                                            <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                              {field}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {templates.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No data templates found.</p>
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

export default AdminImportExport;