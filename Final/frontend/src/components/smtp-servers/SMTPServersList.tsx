/**
 * SMTP Servers List Component
 * Comprehensive SMTP server management with full CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip';
import {
    Server,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
    Search,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Shield,
    Zap,
    Clock,
    Mail,
    Settings,
    TestTube,
    Copy,
    Power,
    Activity,
    Lock,
    Unlock,
    Globe,
    Filter,
    Download,
    Upload,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smtpApi } from '@/api/smtp-api';
import { cn } from '@/lib/utils';
import SMTPServerForm from './SMTPServerForm';
import SMTPTestDialog from './SMTPTestDialog';

interface SMTPServer {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    security: 'none' | 'tls' | 'ssl' | 'starttls';
    status: 'active' | 'inactive' | 'error' | 'testing';
    lastTested?: string;
    lastError?: string;
    performance?: {
        avgResponseTime: number;
        successRate: number;
        totalSent: number;
    };
    createdAt: string;
    updatedAt: string;
    isDefault?: boolean;
    maxConnections?: number;
    currentConnections?: number;
    dailyLimit?: number;
    dailySent?: number;
    tags?: string[];
}

interface SMTPServersListProps {
    sessionId: string;
    onServerSelect?: (server: SMTPServer) => void;
    className?: string;
}

export default function SMTPServersList({
    sessionId,
    onServerSelect,
    className
}: SMTPServersListProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedServer, setSelectedServer] = useState<SMTPServer | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
    const [selectedServers, setSelectedServers] = useState<string[]>([]);

    // Fetch SMTP servers
    const { data: servers = [], isLoading, refetch } = useQuery({
        queryKey: ['smtp-servers', sessionId],
        queryFn: () => smtpApi.listServers(sessionId),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Delete server mutation
    const deleteMutation = useMutation({
        mutationFn: (serverId: string) => smtpApi.deleteServer(sessionId, serverId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['smtp-servers', sessionId] });
            toast({
                title: 'Success',
                description: 'SMTP server deleted successfully',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete SMTP server',
                variant: 'destructive',
            });
        },
    });

    // Toggle server status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: ({ serverId, status }: { serverId: string; status: 'active' | 'inactive' }) =>
            smtpApi.updateServer(sessionId, serverId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['smtp-servers', sessionId] });
            toast({
                title: 'Success',
                description: 'Server status updated',
            });
        },
    });

    // Filter servers based on search and status
    const filteredServers = servers.filter((server: SMTPServer) => {
        const matchesSearch =
            server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            server.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
            server.username.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            selectedFilter === 'all' || server.status === selectedFilter;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
            inactive: { color: 'bg-gray-500/10 text-gray-500', icon: XCircle },
            error: { color: 'bg-red-500/10 text-red-500', icon: AlertTriangle },
            testing: { color: 'bg-blue-500/10 text-blue-500', icon: Loader2 },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
        const Icon = config.icon;

        return (
            <Badge variant="outline" className={cn('gap-1', config.color)}>
                <Icon className="w-3 h-3" />
                {status}
            </Badge>
        );
    };

    const getSecurityIcon = (security: string) => {
        switch (security) {
            case 'ssl':
            case 'tls':
            case 'starttls':
                return <Lock className="w-3 h-3 text-green-500" />;
            default:
                return <Unlock className="w-3 h-3 text-yellow-500" />;
        }
    };

    const handleBulkDelete = () => {
        if (selectedServers.length === 0) return;

        if (confirm(`Are you sure you want to delete ${selectedServers.length} servers?`)) {
            selectedServers.forEach(serverId => {
                deleteMutation.mutate(serverId);
            });
            setSelectedServers([]);
        }
    };

    const exportServers = () => {
        const data = JSON.stringify(filteredServers, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smtp-servers-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <TooltipProvider>
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader className="border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="w-5 h-5" />
                                SMTP Servers
                            </CardTitle>
                            <CardDescription>
                                Manage your SMTP server configurations
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportServers}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setIsAddDialogOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Server
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Filters and Search */}
                    <div className="flex items-center gap-4 p-4 border-b">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search servers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="w-4 h-4 mr-2" />
                                    {selectedFilter === 'all' ? 'All Status' : selectedFilter}
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                                    All Servers
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedFilter('active')}>
                                    Active Only
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedFilter('inactive')}>
                                    Inactive Only
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedFilter('error')}>
                                    Errors Only
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Bulk Actions */}
                    {selectedServers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-muted/50 border-b"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {selectedServers.length} server(s) selected
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedServers([])}
                                    >
                                        Clear Selection
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Selected
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Servers Table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredServers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Server className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No SMTP Servers</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm || selectedFilter !== 'all'
                                    ? 'No servers match your filters'
                                    : 'Get started by adding your first SMTP server'}
                            </p>
                            {!searchTerm && selectedFilter === 'all' && (
                                <Button onClick={() => setIsAddDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Server
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <input
                                            type="checkbox"
                                            checked={selectedServers.length === filteredServers.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedServers(filteredServers.map(s => s.id));
                                                } else {
                                                    setSelectedServers([]);
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </TableHead>
                                    <TableHead>Server</TableHead>
                                    <TableHead>Host</TableHead>
                                    <TableHead>Security</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Performance</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {filteredServers.map((server: SMTPServer) => (
                                        <motion.tr
                                            key={server.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-muted/5"
                                        >
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServers.includes(server.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedServers([...selectedServers, server.id]);
                                                        } else {
                                                            setSelectedServers(selectedServers.filter(id => id !== server.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-lg bg-muted">
                                                        <Server className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {server.name}
                                                            {server.isDefault && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Default
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {server.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-3 h-3 text-muted-foreground" />
                                                    <span className="font-mono text-sm">
                                                        {server.host}:{server.port}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {getSecurityIcon(server.security)}
                                                    <span className="text-sm uppercase">{server.security}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(server.status)}</TableCell>
                                            <TableCell>
                                                {server.performance ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="w-3 h-3 text-yellow-500" />
                                                            <span className="text-sm">
                                                                {server.performance.avgResponseTime}ms
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="w-3 h-3 text-green-500" />
                                                            <span className="text-sm">
                                                                {server.performance.successRate}% success
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No data</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-sm">
                                                        {server.currentConnections || 0}/{server.maxConnections || '∞'} connections
                                                    </div>
                                                    {server.dailyLimit && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {server.dailySent || 0}/{server.dailyLimit} daily
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedServer(server);
                                                                setIsTestDialogOpen(true);
                                                            }}
                                                        >
                                                            <TestTube className="w-4 h-4 mr-2" />
                                                            Test Connection
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedServer(server);
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                const newStatus = server.status === 'active' ? 'inactive' : 'active';
                                                                toggleStatusMutation.mutate({
                                                                    serverId: server.id,
                                                                    status: newStatus
                                                                });
                                                            }}
                                                        >
                                                            <Power className="w-4 h-4 mr-2" />
                                                            {server.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(
                                                                    `${server.host}:${server.port}`
                                                                );
                                                                toast({
                                                                    title: 'Copied',
                                                                    description: 'Server details copied to clipboard',
                                                                });
                                                            }}
                                                        >
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Copy Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this server?')) {
                                                                    deleteMutation.mutate(server.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add Server Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add SMTP Server</DialogTitle>
                        <DialogDescription>
                            Configure a new SMTP server for sending emails
                        </DialogDescription>
                    </DialogHeader>
                    <SMTPServerForm
                        sessionId={sessionId}
                        onSuccess={() => {
                            setIsAddDialogOpen(false);
                            queryClient.invalidateQueries({ queryKey: ['smtp-servers', sessionId] });
                        }}
                        onCancel={() => setIsAddDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Server Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit SMTP Server</DialogTitle>
                        <DialogDescription>
                            Update SMTP server configuration
                        </DialogDescription>
                    </DialogHeader>
                    {selectedServer && (
                        <SMTPServerForm
                            sessionId={sessionId}
                            initialData={selectedServer}
                            onSuccess={() => {
                                setIsEditDialogOpen(false);
                                setSelectedServer(null);
                                queryClient.invalidateQueries({ queryKey: ['smtp-servers', sessionId] });
                            }}
                            onCancel={() => {
                                setIsEditDialogOpen(false);
                                setSelectedServer(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Test Server Dialog */}
            {selectedServer && (
                <SMTPTestDialog
                    isOpen={isTestDialogOpen}
                    onClose={() => {
                        setIsTestDialogOpen(false);
                        setSelectedServer(null);
                    }}
                    server={selectedServer}
                    sessionId={sessionId}
                />
            )}
        </TooltipProvider>
    );
}
