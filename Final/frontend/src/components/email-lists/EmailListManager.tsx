/**
 * Email List Manager Component
 * Comprehensive email list management with CRUD operations, import/export, and segmentation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Plus,
    Upload,
    Download,
    Edit,
    Trash2,
    MoreHorizontal,
    Search,
    Filter,
    Mail,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FileText,
    Copy,
    Merge,
    Split,
    UserPlus,
    UserMinus,
    Tag,
    Activity,
    Shield,
    Zap,
    Clock,
    RefreshCw,
    ChevronDown,
    Loader2,
    Info,
    Database,
    FileSpreadsheet,
    Hash,
    AtSign,
    Calendar,
    BarChart3,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import EmailListUploadDialog from './EmailListUploadDialog';
import EmailValidationDialog from './EmailValidationDialog';
import EmailSegmentationDialog from './EmailSegmentationDialog';

interface EmailContact {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'active' | 'unsubscribed' | 'bounced' | 'invalid' | 'pending';
    tags: string[];
    customFields?: Record<string, any>;
    addedAt: string;
    lastActivity?: string;
    source?: string;
    validationStatus?: 'valid' | 'invalid' | 'risky' | 'unknown';
    engagementScore?: number;
}

interface EmailList {
    id: string;
    name: string;
    description?: string;
    contactCount: number;
    activeCount: number;
    unsubscribedCount: number;
    bouncedCount: number;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    segments?: EmailSegment[];
    importStatus?: 'idle' | 'importing' | 'processing' | 'completed' | 'failed';
    validationStatus?: 'validated' | 'partially_validated' | 'not_validated';
}

interface EmailSegment {
    id: string;
    name: string;
    criteria: SegmentCriteria[];
    contactCount: number;
    lastUpdated: string;
}

interface SegmentCriteria {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
    value: string | number;
}

interface EmailListManagerProps {
    sessionId: string;
    onListSelect?: (list: EmailList) => void;
    className?: string;
}

export default function EmailListManager({
    sessionId,
    onListSelect,
    className,
}: EmailListManagerProps) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedList, setSelectedList] = useState<EmailList | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
    const [isSegmentationDialogOpen, setIsSegmentationDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'lists' | 'contacts'>('lists');
    const [contactFilter, setContactFilter] = useState<'all' | 'active' | 'unsubscribed' | 'bounced'>('all');

    // Sample data - replace with actual API calls
    const [lists, setLists] = useState<EmailList[]>([
        {
            id: '1',
            name: 'Newsletter Subscribers',
            description: 'Main newsletter subscription list',
            contactCount: 15420,
            activeCount: 14580,
            unsubscribedCount: 620,
            bouncedCount: 220,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-06-20T15:30:00Z',
            tags: ['newsletter', 'main'],
            validationStatus: 'validated',
        },
        {
            id: '2',
            name: 'Premium Customers',
            description: 'Customers with active premium subscriptions',
            contactCount: 3250,
            activeCount: 3180,
            unsubscribedCount: 50,
            bouncedCount: 20,
            createdAt: '2024-02-01T08:00:00Z',
            updatedAt: '2024-06-19T12:00:00Z',
            tags: ['customers', 'premium'],
            validationStatus: 'partially_validated',
        },
        {
            id: '3',
            name: 'Webinar Attendees',
            description: 'People who attended our webinars',
            contactCount: 5680,
            activeCount: 5200,
            unsubscribedCount: 380,
            bouncedCount: 100,
            createdAt: '2024-03-10T14:00:00Z',
            updatedAt: '2024-06-18T09:00:00Z',
            tags: ['webinar', 'leads'],
            validationStatus: 'not_validated',
        },
    ]);

    const [contacts, setContacts] = useState<EmailContact[]>([
        {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            status: 'active',
            tags: ['customer', 'vip'],
            addedAt: '2024-01-15T10:00:00Z',
            lastActivity: '2024-06-19T14:30:00Z',
            source: 'Website Form',
            validationStatus: 'valid',
            engagementScore: 85,
        },
        {
            id: '2',
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            status: 'active',
            tags: ['newsletter'],
            addedAt: '2024-02-20T11:00:00Z',
            lastActivity: '2024-06-18T10:00:00Z',
            source: 'Import',
            validationStatus: 'valid',
            engagementScore: 72,
        },
        {
            id: '3',
            email: 'invalid.email@test',
            status: 'invalid',
            tags: [],
            addedAt: '2024-03-01T09:00:00Z',
            source: 'API',
            validationStatus: 'invalid',
            engagementScore: 0,
        },
    ]);

    const filteredLists = lists.filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch =
            contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            contactFilter === 'all' || contact.status === contactFilter;

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: EmailContact['status']) => {
        const colors = {
            active: 'bg-green-500/10 text-green-500',
            unsubscribed: 'bg-gray-500/10 text-gray-500',
            bounced: 'bg-orange-500/10 text-orange-500',
            invalid: 'bg-red-500/10 text-red-500',
            pending: 'bg-blue-500/10 text-blue-500',
        };
        return colors[status] || colors.pending;
    };

    const getValidationBadge = (status?: EmailContact['validationStatus']) => {
        if (!status) return null;

        const badges = {
            valid: { icon: CheckCircle, color: 'text-green-500', label: 'Valid' },
            invalid: { icon: XCircle, color: 'text-red-500', label: 'Invalid' },
            risky: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Risky' },
            unknown: { icon: Info, color: 'text-gray-500', label: 'Unknown' },
        };

        const badge = badges[status];
        if (!badge) return null;

        const Icon = badge.icon;
        return (
            <div className={cn('flex items-center gap-1', badge.color)}>
                <Icon className="w-3 h-3" />
                <span className="text-xs">{badge.label}</span>
            </div>
        );
    };

    const handleCreateList = (data: { name: string; description?: string; tags: string[] }) => {
        const newList: EmailList = {
            id: Date.now().toString(),
            name: data.name,
            description: data.description,
            contactCount: 0,
            activeCount: 0,
            unsubscribedCount: 0,
            bouncedCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: data.tags,
            validationStatus: 'not_validated',
        };

        setLists([...lists, newList]);
        setIsCreateDialogOpen(false);

        toast({
            title: 'Success',
            description: 'Email list created successfully',
        });
    };

    const handleDeleteList = (listId: string) => {
        if (confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
            setLists(lists.filter(list => list.id !== listId));
            toast({
                title: 'Success',
                description: 'Email list deleted',
            });
        }
    };

    const handleExportList = (list: EmailList) => {
        // Simulate export
        const data = {
            list: list,
            contacts: contacts.filter(c => c.status === 'active'),
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${list.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Success',
            description: `Exported ${list.contactCount} contacts`,
        });
    };

    const handleBulkAction = (action: 'delete' | 'unsubscribe' | 'resubscribe' | 'validate') => {
        if (selectedContacts.length === 0) return;

        switch (action) {
            case 'delete':
                if (confirm(`Delete ${selectedContacts.length} contacts?`)) {
                    setContacts(contacts.filter(c => !selectedContacts.includes(c.id)));
                    setSelectedContacts([]);
                    toast({
                        title: 'Success',
                        description: `Deleted ${selectedContacts.length} contacts`,
                    });
                }
                break;
            case 'unsubscribe':
                setContacts(contacts.map(c =>
                    selectedContacts.includes(c.id) ? { ...c, status: 'unsubscribed' as const } : c
                ));
                setSelectedContacts([]);
                toast({
                    title: 'Success',
                    description: `Unsubscribed ${selectedContacts.length} contacts`,
                });
                break;
            case 'validate':
                setIsValidationDialogOpen(true);
                break;
        }
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="w-8 h-8" />
                        Email Lists
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your email lists and contacts
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsUploadDialogOpen(true)}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                    </Button>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New List
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lists.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {lists.filter(l => l.validationStatus === 'validated').length} validated
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {lists.reduce((sum, list) => sum + list.contactCount, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all lists
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {lists.reduce((sum, list) => sum + list.activeCount, 0).toLocaleString()}
                        </div>
                        <Badge variant="secondary" className="mt-1 text-xs">
                            {((lists.reduce((sum, list) => sum + list.activeCount, 0) /
                                lists.reduce((sum, list) => sum + list.contactCount, 0)) * 100).toFixed(1)}% rate
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">73.5%</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            +5.2% this month
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="lists">Lists</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    </TabsList>

                    {/* Search and Filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={activeTab === 'lists' ? 'Search lists...' : 'Search contacts...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-[300px]"
                            />
                        </div>

                        {activeTab === 'contacts' && (
                            <Select value={contactFilter} onValueChange={(v: any) => setContactFilter(v)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Contacts</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                                    <SelectItem value="bounced">Bounced</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Lists Tab */}
                <TabsContent value="lists">
                    <Card>
                        <CardContent className="p-0">
                            {filteredLists.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <Database className="w-12 h-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Email Lists</h3>
                                    <p className="text-muted-foreground mb-4">
                                        {searchTerm ? 'No lists match your search' : 'Create your first email list to get started'}
                                    </p>
                                    {!searchTerm && (
                                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create First List
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>List Name</TableHead>
                                            <TableHead>Contacts</TableHead>
                                            <TableHead>Active</TableHead>
                                            <TableHead>Validation</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLists.map(list => (
                                            <TableRow key={list.id} className="cursor-pointer" onClick={() => setSelectedList(list)}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-muted">
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{list.name}</div>
                                                            {list.description && (
                                                                <div className="text-sm text-muted-foreground">{list.description}</div>
                                                            )}
                                                            <div className="flex gap-1 mt-1">
                                                                {list.tags.map(tag => (
                                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{list.contactCount.toLocaleString()}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {list.bouncedCount > 0 && (
                                                            <span className="text-orange-500">{list.bouncedCount} bounced</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Progress
                                                            value={(list.activeCount / list.contactCount) * 100}
                                                            className="w-[60px] h-2"
                                                        />
                                                        <span className="text-sm">
                                                            {((list.activeCount / list.contactCount) * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            list.validationStatus === 'validated' ? 'default' :
                                                                list.validationStatus === 'partially_validated' ? 'secondary' : 'outline'
                                                        }
                                                    >
                                                        {list.validationStatus?.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {new Date(list.updatedAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(list.updatedAt).toLocaleTimeString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setIsSegmentationDialogOpen(true)}>
                                                                <Split className="w-4 h-4 mr-2" />
                                                                Create Segment
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setIsValidationDialogOpen(true)}>
                                                                <Shield className="w-4 h-4 mr-2" />
                                                                Validate List
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleExportList(list)}>
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Export
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDeleteList(list.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>All Contacts</CardTitle>
                                {selectedContacts.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            {selectedContacts.length} selected
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedContacts([])}
                                        >
                                            Clear
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    Bulk Actions
                                                    <ChevronDown className="w-4 h-4 ml-2" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleBulkAction('validate')}>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Validate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleBulkAction('unsubscribe')}>
                                                    <UserMinus className="w-4 h-4 mr-2" />
                                                    Unsubscribe
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleBulkAction('resubscribe')}>
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Resubscribe
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleBulkAction('delete')}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredContacts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <Mail className="w-12 h-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Contacts Found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        {searchTerm || contactFilter !== 'all'
                                            ? 'No contacts match your filters'
                                            : 'Import contacts to get started'}
                                    </p>
                                    {!searchTerm && contactFilter === 'all' && (
                                        <Button onClick={() => setIsUploadDialogOpen(true)}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Import Contacts
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
                                                    checked={selectedContacts.length === filteredContacts.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedContacts(filteredContacts.map(c => c.id));
                                                        } else {
                                                            setSelectedContacts([]);
                                                        }
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                            </TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Validation</TableHead>
                                            <TableHead>Engagement</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Added</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredContacts.map(contact => (
                                            <TableRow key={contact.id}>
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContacts.includes(contact.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedContacts([...selectedContacts, contact.id]);
                                                            } else {
                                                                setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                                                            }
                                                        }}
                                                        className="rounded border-gray-300"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <AtSign className="w-3 h-3 text-muted-foreground" />
                                                        <span className="font-mono text-sm">{contact.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {contact.firstName || contact.lastName ? (
                                                        <div>{contact.firstName} {contact.lastName}</div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn('text-xs', getStatusColor(contact.status))}>
                                                        {contact.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{getValidationBadge(contact.validationStatus)}</TableCell>
                                                <TableCell>
                                                    {contact.engagementScore !== undefined && contact.engagementScore > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <Progress
                                                                value={contact.engagementScore}
                                                                className="w-[50px] h-2"
                                                            />
                                                            <span className="text-sm">{contact.engagementScore}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{contact.source || '—'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {new Date(contact.addedAt).toLocaleDateString()}
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
                                                            <DropdownMenuItem>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Activity className="w-4 h-4 mr-2" />
                                                                View Activity
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <Tag className="w-4 h-4 mr-2" />
                                                                Manage Tags
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {contact.status === 'active' ? (
                                                                <DropdownMenuItem>
                                                                    <UserMinus className="w-4 h-4 mr-2" />
                                                                    Unsubscribe
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem>
                                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                                    Resubscribe
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem className="text-red-600">
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create List Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Email List</DialogTitle>
                        <DialogDescription>
                            Create a new list to organize your email contacts
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        handleCreateList({
                            name: formData.get('name') as string,
                            description: formData.get('description') as string,
                            tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
                        });
                    }}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">List Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="e.g., Newsletter Subscribers"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe the purpose of this list..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    name="tags"
                                    placeholder="newsletter, customers, leads (comma-separated)"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create List</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Placeholder for other dialogs */}
            {isUploadDialogOpen && (
                <EmailListUploadDialog
                    isOpen={isUploadDialogOpen}
                    onClose={() => setIsUploadDialogOpen(false)}
                    onUpload={(data) => {
                        console.log('Upload data:', data);
                        setIsUploadDialogOpen(false);
                    }}
                />
            )}

            {isValidationDialogOpen && (
                <EmailValidationDialog
                    isOpen={isValidationDialogOpen}
                    onClose={() => setIsValidationDialogOpen(false)}
                    contacts={selectedContacts.length > 0
                        ? contacts.filter(c => selectedContacts.includes(c.id))
                        : contacts
                    }
                />
            )}

            {isSegmentationDialogOpen && selectedList && (
                <EmailSegmentationDialog
                    isOpen={isSegmentationDialogOpen}
                    onClose={() => setIsSegmentationDialogOpen(false)}
                    list={selectedList}
                />
            )}
        </div>
    );
}
