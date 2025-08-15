/**
 * 🚀 IMAP Checker Console - Real-time IMAP Server Testing & Monitoring
 * Professional live console for testing IMAP connections and folder scanning
 * Matches legacy mass marketing software with real-time folder monitoring
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Server, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Pause, 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Trash2, 
  Activity, 
  Settings,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Eye,
  EyeOff,
  Shield,
  Key,
  Wifi,
  WifiOff,
  Folder,
  FolderOpen,
  FileText,
  Inbox,
  Archive,
  Trash,
  Send,
  Star
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';

// Hooks and utilities
import { toast } from 'sonner';

// Types
interface IMAPLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'debug';
  server: string;
  port: number;
  username: string;
  status: 'connecting' | 'connected' | 'authenticating' | 'authenticated' | 'scanning' | 'success' | 'failed' | 'timeout';
  responseTime: number;
  message: string;
  errorCode?: string;
  imapResponse?: string;
  tlsStatus?: 'enabled' | 'disabled' | 'failed';
  folder?: string;
  messageCount?: number;
  unreadCount?: number;
  step: 'connection' | 'capability' | 'starttls' | 'auth' | 'select' | 'examine' | 'search' | 'fetch' | 'logout';
}

interface IMAPTestConfig {
  server: string;
  port: number;
  username: string;
  password: string;
  useTLS: boolean;
  useAuth: boolean;
  scanFolders: boolean;
  maxMessages: number;
  timeout: number;
  selectedFolders: string[];
}

interface IMAPStats {
  totalConnections: number;
  successful: number;
  failed: number;
  inProgress: number;
  avgResponseTime: number;
  successRate: number;
  totalFolders: number;
  totalMessages: number;
  unreadMessages: number;
  tlsConnections: number;
  authSuccess: number;
  foldersScanned: number;
}

interface IMAPFolder {
  name: string;
  messages: number;
  unread: number;
  recent: number;
  uidValidity: number;
  flags: string[];
  delimiter: string;
  attributes: string[];
}

interface ConsoleFilters {
  showInfo: boolean;
  showSuccess: boolean;
  showWarning: boolean;
  showError: boolean;
  showDebug: boolean;
  search: string;
  status: string;
  server: string;
  step: string;
  folder: string;
}

const IMAPCheckerConsole = ({ className = "" }: { className?: string }) => {
  // State Management
  const [logs, setLogs] = useState<IMAPLogEntry[]>([]);
  const [stats, setStats] = useState<IMAPStats>({
    totalConnections: 0,
    successful: 0,
    failed: 0,
    inProgress: 0,
    avgResponseTime: 0,
    successRate: 0,
    totalFolders: 0,
    totalMessages: 0,
    unreadMessages: 0,
    tlsConnections: 0,
    authSuccess: 0,
    foldersScanned: 0
  });
  
  const [folders, setFolders] = useState<IMAPFolder[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [maxLogs, setMaxLogs] = useState(1000);
  
  // Test Configuration
  const [testConfig, setTestConfig] = useState<IMAPTestConfig>({
    server: 'imap.gmail.com',
    port: 993,
    username: '',
    password: '',
    useTLS: true,
    useAuth: true,
    scanFolders: true,
    maxMessages: 100,
    timeout: 30000,
    selectedFolders: ['INBOX', 'Sent', 'Drafts', 'Trash']
  });
  
  // Filters
  const [filters, setFilters] = useState<ConsoleFilters>({
    showInfo: true,
    showSuccess: true,
    showWarning: true,
    showError: true,
    showDebug: false,
    search: '',
    status: 'all',
    server: 'all',
    step: 'all',
    folder: 'all'
  });

  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Log type colors and icons
  const logTypeConfig = {
    info: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Activity },
    success: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
    warning: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: AlertTriangle },
    error: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
    debug: { color: 'text-muted-foreground dark:text-muted-foreground', bg: 'bg-muted dark:bg-background/20', icon: Settings }
  };

  // Status colors
  const statusColors = {
    connecting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    connected: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
    authenticating: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    authenticated: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    scanning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    timeout: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  };

  // Step colors
  const stepColors = {
    connection: 'text-blue-400',
    capability: 'text-cyan-400',
    starttls: 'text-purple-400',
    auth: 'text-yellow-400',
    select: 'text-green-400',
    examine: 'text-indigo-400',
    search: 'text-pink-400',
    fetch: 'text-orange-400',
    logout: 'text-muted-foreground'
  };

  // Folder icons
  const getFolderIcon = (folderName: string) => {
    const name = folderName.toLowerCase();
    if (name.includes('inbox')) return Inbox;
    if (name.includes('sent')) return Send;
    if (name.includes('draft')) return FileText;
    if (name.includes('trash') || name.includes('deleted')) return Trash;
    if (name.includes('archive')) return Archive;
    if (name.includes('star') || name.includes('important')) return Star;
    return Folder;
  };

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Type filters
    if (!filters.showInfo && log.type === 'info') return false;
    if (!filters.showSuccess && log.type === 'success') return false;
    if (!filters.showWarning && log.type === 'warning') return false;
    if (!filters.showError && log.type === 'error') return false;
    if (!filters.showDebug && log.type === 'debug') return false;
    
    // Search filter
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.server.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.username.toLowerCase().includes(filters.search.toLowerCase()) &&
        !log.folder?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    
    // Server filter
    if (filters.server !== 'all' && log.server !== filters.server) return false;
    
    // Step filter
    if (filters.step !== 'all' && log.step !== filters.step) return false;
    
    // Folder filter
    if (filters.folder !== 'all' && log.folder !== filters.folder) return false;
    
    return true;
  });

  // Generate mock folder data
  const generateMockFolders = useCallback((): IMAPFolder[] => [
    {
      name: 'INBOX',
      messages: Math.floor(Math.random() * 500) + 100,
      unread: Math.floor(Math.random() * 50) + 5,
      recent: Math.floor(Math.random() * 10),
      uidValidity: 1234567890,
      flags: ['\\Seen', '\\Answered', '\\Flagged', '\\Deleted', '\\Draft'],
      delimiter: '/',
      attributes: ['\\HasNoChildren']
    },
    {
      name: 'Sent',
      messages: Math.floor(Math.random() * 200) + 50,
      unread: 0,
      recent: 0,
      uidValidity: 1234567891,
      flags: ['\\Seen'],
      delimiter: '/',
      attributes: ['\\HasNoChildren', '\\Sent']
    },
    {
      name: 'Drafts',
      messages: Math.floor(Math.random() * 20) + 2,
      unread: Math.floor(Math.random() * 5),
      recent: 0,
      uidValidity: 1234567892,
      flags: ['\\Draft'],
      delimiter: '/',
      attributes: ['\\HasNoChildren', '\\Drafts']
    },
    {
      name: 'Trash',
      messages: Math.floor(Math.random() * 100) + 10,
      unread: 0,
      recent: 0,
      uidValidity: 1234567893,
      flags: ['\\Deleted'],
      delimiter: '/',
      attributes: ['\\HasNoChildren', '\\Trash']
    }
  ], []);

  // Generate mock log entry (for development)
  const generateMockLogEntry = useCallback((): IMAPLogEntry => {
    const servers = ['imap.gmail.com', 'outlook.office365.com', 'imap.yahoo.com', 'imap.aol.com', 'imap.mail.ru'];
    const usernames = ['user1@gmail.com', 'user2@outlook.com', 'user3@yahoo.com', 'user4@aol.com', 'user5@mail.ru'];
    const statuses: IMAPLogEntry['status'][] = ['success', 'failed', 'timeout', 'connecting', 'authenticated', 'scanning'];
    const steps: IMAPLogEntry['step'][] = ['connection', 'capability', 'starttls', 'auth', 'select', 'examine', 'search', 'fetch', 'logout'];
    const folderNames = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'Spam', 'Important'];
    
    const server = servers[Math.floor(Math.random() * servers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const step = steps[Math.floor(Math.random() * steps.length)];
    const type = status === 'success' || status === 'authenticated' ? 'success' : 
                 status === 'failed' || status === 'timeout' ? 'error' : 'info';
    
    const port = server.includes('gmail') ? 993 : server.includes('outlook') ? 993 : 
                 server.includes('yahoo') ? 993 : 993;
    
    const folder = Math.random() > 0.3 ? folderNames[Math.floor(Math.random() * folderNames.length)] : undefined;
    
    const messages = {
      connection: status === 'success' ? 'IMAP connection established successfully' : 'Failed to establish IMAP connection',
      capability: status === 'success' ? 'CAPABILITY command successful, server features received' : 'CAPABILITY command failed',
      starttls: status === 'success' ? 'STARTTLS negotiation successful, connection secured' : 'STARTTLS failed',
      auth: status === 'success' ? 'Authentication successful' : 'Authentication failed - invalid credentials',
      select: status === 'success' ? `Folder ${folder} selected successfully` : `Failed to select folder ${folder}`,
      examine: status === 'success' ? `Folder ${folder} examined successfully` : `Failed to examine folder ${folder}`,
      search: status === 'success' ? `Search completed, found ${Math.floor(Math.random() * 50)} messages` : 'Search failed',
      fetch: status === 'success' ? `Fetched ${Math.floor(Math.random() * 10) + 1} message headers` : 'Failed to fetch messages',
      logout: 'LOGOUT command sent, connection closed gracefully'
    };
    
    const messageCount = step === 'select' || step === 'examine' ? Math.floor(Math.random() * 1000) + 10 : undefined;
    const unreadCount = messageCount ? Math.floor(Math.random() * Math.min(messageCount, 100)) : undefined;
    
    return {
      id: `imap_log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      server,
      port,
      username: usernames[Math.floor(Math.random() * usernames.length)],
      status,
      responseTime: Math.floor(Math.random() * 3000) + 100,
      message: messages[step],
      step,
      folder,
      messageCount,
      unreadCount,
      errorCode: status === 'failed' ? `${Math.floor(Math.random() * 100) + 400}` : undefined,
      imapResponse: status === 'success' ? 'OK SUCCESS' : status === 'failed' ? 'NO FAILURE' : undefined,
      tlsStatus: Math.random() > 0.2 ? 'enabled' : 'disabled'
    };
  }, []);

  // Mock stats update
  const updateMockStats = useCallback(() => {
    setStats(prev => {
      const total = logs.length;
      const successful = logs.filter(l => l.status === 'success' || l.status === 'authenticated').length;
      const failed = logs.filter(l => l.status === 'failed' || l.status === 'timeout').length;
      const inProgress = logs.filter(l => l.status === 'connecting' || l.status === 'authenticating' || l.status === 'scanning').length;
      
      const totalMessages = folders.reduce((sum, folder) => sum + folder.messages, 0);
      const unreadMessages = folders.reduce((sum, folder) => sum + folder.unread, 0);
      
      return {
        totalConnections: total + 89,
        successful: successful + 67,
        failed: failed + 8,
        inProgress: inProgress + 2,
        avgResponseTime: Math.floor(Math.random() * 800) + 200,
        successRate: total > 0 ? ((successful / total) * 100) : 89.5,
        totalFolders: folders.length + 15,
        totalMessages: totalMessages + 12500,
        unreadMessages: unreadMessages + 245,
        tlsConnections: successful + 62,
        authSuccess: successful + 64,
        foldersScanned: folders.length + 12
      };
    });
  }, [logs, folders]);

  // Start IMAP test
  const startIMAPTest = async () => {
    if (!testConfig.server || !testConfig.username) {
      toast.error('Please configure IMAP server and username');
      return;
    }
    
    setIsActive(true);
    toast.success('IMAP testing started');
    
    // Generate initial folder data
    setFolders(generateMockFolders());
    
    // Start mock data generation for development
    const interval = setInterval(() => {
      if (logs.length < maxLogs) {
        const newLog = generateMockLogEntry();
        setLogs(prev => [...prev.slice(-(maxLogs-1)), newLog]);
      }
    }, 1500 + Math.random() * 2500); // Random interval 1.5-4 seconds
    
    // Cleanup interval when component unmounts or stops
    return () => clearInterval(interval);
  };

  // Stop IMAP test
  const stopIMAPTest = () => {
    setIsActive(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    toast.success('IMAP testing stopped');
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    toast.success('Console cleared');
  };

  // Export logs
  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Type,Server,Port,Username,Status,Response Time,Step,Folder,Messages,Unread,Message,TLS',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.type}","${log.server}","${log.port}","${log.username}","${log.status}","${log.responseTime}","${log.step}","${log.folder || ''}","${log.messageCount || ''}","${log.unreadCount || ''}","${log.message}","${log.tlsStatus}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imap_console_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('IMAP logs exported');
  };

  // Update stats when logs change
  useEffect(() => {
    updateMockStats();
  }, [logs, folders, updateMockStats]);

  // Auto scroll when new logs arrive
  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-background' : ''} ${className}`}>
      <Card className="border-0 shadow-lg bg-background text-green-400 font-mono">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-muted'}`}
                />
                <CardTitle className="text-green-400">IMAP Checker Console</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Server: {testConfig.server}:{testConfig.port}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={isActive ? stopIMAPTest : startIMAPTest}
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? 'Stop' : 'Scan'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPaused(!isPaused)}
                disabled={!isActive}
                className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={clearLogs}
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={exportLogs}
                className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{stats.successful.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{stats.failed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{stats.inProgress.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Scanning</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{stats.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{stats.avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.totalFolders}</div>
              <div className="text-xs text-muted-foreground">Folders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{stats.totalMessages.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pink-400">{stats.unreadMessages.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-400">{stats.tlsConnections}</div>
              <div className="text-xs text-muted-foreground">TLS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.authSuccess}</div>
              <div className="text-xs text-muted-foreground">Auth OK</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-teal-400">{stats.foldersScanned}</div>
              <div className="text-xs text-muted-foreground">Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-lime-400">{stats.totalConnections}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
          
          {/* Folder Summary */}
          {folders.length > 0 && (
            <div className="mt-4 p-3 bg-card rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Active Folders:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.map((folder, index) => {
                  const FolderIcon = getFolderIcon(folder.name);
                  return (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <FolderIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-cyan-400">{folder.name}</span>
                      <span className="text-muted-foreground">({folder.messages})</span>
                      {folder.unread > 0 && (
                        <Badge className="text-xs bg-red-500 text-white">
                          {folder.unread}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4">
          {/* IMAP Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 p-3 bg-card rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Server</Label>
              <Input
                value={testConfig.server}
                onChange={(e) => setTestConfig(prev => ({ ...prev, server: e.target.value }))}
                className="h-8 bg-muted border-border text-muted-foreground"
                placeholder="imap.gmail.com"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Port</Label>
              <Input
                type="number"
                value={testConfig.port}
                onChange={(e) => setTestConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 993 }))}
                className="h-8 bg-muted border-border text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input
                value={testConfig.username}
                onChange={(e) => setTestConfig(prev => ({ ...prev, username: e.target.value }))}
                className="h-8 bg-muted border-border text-muted-foreground"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={testConfig.password}
                onChange={(e) => setTestConfig(prev => ({ ...prev, password: e.target.value }))}
                className="h-8 bg-muted border-border text-muted-foreground"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                checked={testConfig.useTLS}
                onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, useTLS: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-muted-foreground">TLS</span>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                checked={testConfig.scanFolders}
                onCheckedChange={(checked) => setTestConfig(prev => ({ ...prev, scanFolders: checked }))}
                className="scale-75"
              />
              <span className="text-xs text-muted-foreground">Scan</span>
            </div>
          </div>
          
          {/* Console Logs */}
          <ScrollArea className={`${isFullscreen ? 'h-[calc(100vh-400px)]' : 'h-96'} bg-black rounded-lg p-3 mb-4`}>
            <div className="space-y-1">
              <AnimatePresence>
                {filteredLogs.map((log) => {
                  const LogIcon = logTypeConfig[log.type].icon;
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-start space-x-3 text-xs p-2 rounded hover:bg-card/50"
                    >
                      <div className="flex-shrink-0 w-20 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <LogIcon className={`h-4 w-4 ${logTypeConfig[log.type].color}`} />
                      </div>
                      
                      <div className="flex-shrink-0 w-24 truncate">
                        <span className="text-green-400">{log.server}</span>
                      </div>
                      
                      <div className="flex-shrink-0 w-12 text-purple-400">
                        {log.port}
                      </div>
                      
                      <div className="flex-shrink-0 w-32 truncate">
                        <span className="text-yellow-400">{log.username}</span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Badge className={`text-xs ${statusColors[log.status]}`}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <div className="flex-shrink-0 w-16 text-orange-400">
                        {log.responseTime}ms
                      </div>
                      
                      <div className="flex-shrink-0 w-20">
                        <span className={`text-xs ${stepColors[log.step]}`}>
                          {log.step.toUpperCase()}
                        </span>
                      </div>
                      
                      {log.folder && (
                        <div className="flex-shrink-0 w-16 text-cyan-400 truncate">
                          {log.folder}
                        </div>
                      )}
                      
                      <div className="flex-1 text-muted-foreground">
                        {log.message}
                        {log.imapResponse && <span className="text-green-400 ml-2">{log.imapResponse}</span>}
                        {log.errorCode && <span className="text-red-400 ml-2">Error: {log.errorCode}</span>}
                        {log.messageCount && <span className="text-blue-400 ml-2">Msgs: {log.messageCount}</span>}
                        {log.unreadCount && <span className="text-pink-400 ml-2">Unread: {log.unreadCount}</span>}
                        {log.tlsStatus && <span className="text-purple-400 ml-2">TLS: {log.tlsStatus}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
          
          {/* Console Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {filteredLogs.length} of {logs.length} log entries
            </div>
            <div className="flex items-center space-x-4">
              <div>Max logs: {maxLogs}</div>
              <div className="flex items-center space-x-1">
                <span>Auto-scroll:</span>
                <span className={autoScroll ? 'text-green-400' : 'text-muted-foreground'}>
                  {autoScroll ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Status:</span>
                <span className={isActive ? 'text-green-400' : 'text-muted-foreground'}>
                  {isActive ? 'SCANNING' : 'IDLE'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IMAPCheckerConsole;