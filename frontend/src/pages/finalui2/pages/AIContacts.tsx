import React, { useState } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  TagIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VirtualTable } from '@/components/ui/VirtualList';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// Remove avatar usage to simplify list (no pictures)
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import MailLoader from '@/components/ui/MailLoader';
import PageShell from '../components/PageShell';
// ui-kit FilterChips removed; lightweight inline chips used instead
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { LeadsApiFactory } from '@/api/leads-api';
import { deleteLead, validateLead } from '@/api/leads'
import { uploadLeads } from '@/api/leadBases'
import axiosInstance from '@/http/axios';
import { useEffect } from 'react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  country?: string;
  // New normalized status set
  status: 'NEW' | 'AI_NEW' | 'ARCHIVED' | 'JUNK' | 'INBOX';
  tags: string[];
  // Replace score with last used and counters
  lastUsed?: string;
  opens?: number;
  clicks?: number;
  count?: number;
  campaigns: number;
}

export const AIContacts: React.FC = () => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [openEditor, setOpenEditor] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const DEFAULT_LEAD_BASE_ID = (import.meta as any).env?.VITE_DEFAULT_LEAD_BASE_ID as string | undefined;
  const leadsApi = LeadsApiFactory();
  // Cursor pagination state (fast for huge datasets)
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursorLimit = 200;
  const [loading, setLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formStatus, setFormStatus] = useState<Contact['status']>('NEW');

  const defaultContacts: Contact[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      company: 'TechCorp',
      country: 'US',
      status: 'NEW',
      tags: ['VIP', 'Enterprise', 'Tech'],
      lastUsed: '2 hours ago',
      count: 1,
      campaigns: 12,
      opens: 89,
      clicks: 45,
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@startupx.io',
      company: 'StartupX',
      country: 'GB',
      status: 'AI_NEW',
      tags: ['Startup', 'Growth'],
      lastUsed: '1 day ago',
      count: 4,
      campaigns: 8,
      opens: 67,
      clicks: 23
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily.davis@marketing.co',
      company: 'Marketing Co',
      country: 'DE',
      status: 'ARCHIVED',
      tags: ['Marketing', 'SMB'],
      lastUsed: '1 week ago',
      count: 7,
      campaigns: 15,
      opens: 120,
      clicks: 32
    },
    {
      id: '4',
      name: 'James Wilson',
      email: 'jwilson@enterprise.com',
      company: 'Enterprise Inc',
      country: 'FR',
      status: 'INBOX',
      tags: ['Enterprise', 'Decision Maker'],
      lastUsed: '3 hours ago',
      count: 3,
      campaigns: 20,
      opens: 156,
      clicks: 78
    },
  ];

  const segments = [
    { name: 'All Contacts', count: 12543 },
    { name: 'New', count: 8921 },
    { name: 'AI New', count: 342 },
    { name: 'Inbox', count: 2156 },
  ];

  const [contactsData, setContactsData] = useState<Contact[]>(defaultContacts);

  const fetchContacts = async () => {
    if (!DEFAULT_LEAD_BASE_ID) return;
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/api/v1/lead-bases/${DEFAULT_LEAD_BASE_ID}/leads/cursor`, {
        params: {
          cursor: currentCursor || undefined,
          limit: cursorLimit,
          search: searchQuery || undefined,
        },
        withCredentials: true,
      });
      const mapped: Contact[] = (data.items || []).map((l: any) => ({
        id: l.id,
        name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email,
        email: l.email,
        company: l.company,
        country: l.country || l.location || undefined,
        status: 'NEW',
        tags: [],
        lastUsed: new Date(l.updated_at || l.created_at).toLocaleString(),
        campaigns: 0,
        opens: 0,
        clicks: 0,
        count: 0,
      }));
      setContactsData(mapped);
      setNextCursor(data.next_cursor || null);
    } catch (e) {
      console.error('Failed to load contacts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DEFAULT_LEAD_BASE_ID, currentCursor]);

  // Reset cursor when search changes
  useEffect(() => {
    if (!DEFAULT_LEAD_BASE_ID) return;
    setCursorStack([]);
    setCurrentCursor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterStatus, filterTag]);

  const handleSelectAll = () => {
    if (selectedContacts.length === contactsData.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contactsData.map(c => c.id));
    }
  };

  const handleSelectContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'AI_NEW': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'INBOX': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ARCHIVED': return 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30';
      case 'JUNK': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-cyan-400';
    if (score >= 60) return 'text-blue-400';
    return 'text-red-400';
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <PageShell
      title="Leads"
      subtitle="Upload and manage lead lists with AI help"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Leads' }]}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-8 w-64 max-w-full" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={async (e) => {
            try {
              const file = e.target.files?.[0]
              if (!file) return
              if (!DEFAULT_LEAD_BASE_ID) { toast.error?.('No default lead base configured'); return }
              await uploadLeads(DEFAULT_LEAD_BASE_ID, file)
              toast.success?.('Leads uploaded')
              void fetchContacts()
            } catch (err: any) {
              toast.error?.(err?.message || 'Failed to upload leads')
            } finally {
              if (fileInputRef.current) fileInputRef.current.value = ''
            }
          }} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> Import Leads
          </Button>
          <Button variant="outline" size="sm">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export
          </Button>
          <Sheet open={openEditor} onOpenChange={setOpenEditor}>
            <SheetTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <PlusIcon className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{editing ? 'Edit Lead' : 'Add Lead'}</SheetTitle>
                <SheetDescription>
                  {editing ? 'Update lead details and tags' : 'Create a new lead'}
                </SheetDescription>
              </SheetHeader>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Jane Doe" value={formName} onChange={(e)=>setFormName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="jane@example.com" type="email" value={formEmail} onChange={(e)=>setFormEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Acme Inc." value={formCompany} onChange={(e)=>setFormCompany(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="US" />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formStatus} onValueChange={(v)=>setFormStatus(v as Contact['status'])}>
                      <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">NEW</SelectItem>
                        <SelectItem value="AI_NEW">AI NEW</SelectItem>
                        <SelectItem value="INBOX">INBOX</SelectItem>
                        <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                        <SelectItem value="JUNK">JUNK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Optional notes..." tooltip />
                </div>
              </div>
              <SheetFooter>
                <div className="flex items-center gap-2">
                  <Button onClick={async () => {
                    try {
                      const [firstName, ...rest] = formName.trim().split(' ');
                      const lastName = rest.join(' ');
                      if (!editing) {
                        if (!DEFAULT_LEAD_BASE_ID) { setOpenEditor(false); return; }
                        await leadsApi.createLeadInBaseApiV1LeadBasesBaseIdLeadsPost(DEFAULT_LEAD_BASE_ID, { email: formEmail, first_name: firstName || undefined, last_name: lastName || undefined });
                      } else {
                        await leadsApi.updateLeadEntryApiV1LeadsLeadIdPut(editing.id, { first_name: firstName || undefined, last_name: lastName || undefined, email: formEmail || undefined });
                      }
                      setOpenEditor(false);
                      if (DEFAULT_LEAD_BASE_ID) { void fetchContacts(); }
                    } catch (e) {
                      console.error('Save failed', e);
                    }
                  }}><CheckCircleIcon className="w-4 h-4 mr-2" />Save</Button>
                  <Button variant="outline" onClick={() => setOpenEditor(false)}><XCircleIcon className="w-4 h-4 mr-2" />Cancel</Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      }
    >
      <motion.div
        className="relative z-10 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {DEFAULT_LEAD_BASE_ID && (
          <div className="text-xs text-muted-foreground">
            Connected to backend • Base ID: <span className="text-foreground">{DEFAULT_LEAD_BASE_ID}</span>
          </div>
        )}

        {/* Segments Overview (counts summary) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {segments.map((segment, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{segment.name}</p>
                      <p className="text-2xl font-bold mt-1">
                        {segment.count.toLocaleString()}
                      </p>
                    </div>
                      <div className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground/60">{idx+1}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList>
              <TabsTrigger value="all">All Leads</TabsTrigger>
              <TabsTrigger value="segments">Segments</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="NEW">NEW</SelectItem>
                  <SelectItem value="AI_NEW">AI NEW</SelectItem>
                  <SelectItem value="INBOX">INBOX</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  <SelectItem value="JUNK">JUNK</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <FunnelIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['VIP','Enterprise','Startup'].map(tag => (
                <Badge
                  key={tag}
                  variant={filterTag === tag ? 'default' : 'outline'}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className="cursor-pointer"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <VirtualTable
                      data={contactsData
                        .filter(c => filterStatus === 'all' || c.status === filterStatus)
                        .filter(c => !filterTag || c.tags.includes(filterTag))
                        .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      }
                      height={560}
                      rowHeight={48}
                      headerClassName="sticky top-0 z-10"
                      columns={[
                        { key: 'select', header: '', width: 48, render: (item: Contact) => (
                          <Checkbox
                            checked={selectedContacts.includes(item.id)}
                            onCheckedChange={() => handleSelectContact(item.id)}
                          />
                        )},
                        { key: 'contact', header: 'Contact', width: 260, render: (item: Contact) => (
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                          </div>
                        )},
                        { key: 'company', header: 'Company', width: 220, render: (item: Contact) => (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.company}</span>
                            {item.country && (
                              <Badge variant="outline" className="text-[10px] uppercase">{item.country}</Badge>
                            )}
                          </div>
                        )},
                        { key: 'status', header: 'Status', width: 120, render: (item: Contact) => (
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        )},
                        { key: 'count', header: 'Count', width: 80, render: (item: Contact) => (
                          <span className="font-medium">{item.count ?? 0}</span>
                        )},
                        { key: 'tags', header: 'Tags', width: 220, render: (item: Contact) => (
                          <div className="flex gap-1 flex-wrap">
                            {item.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )},
                        { key: 'lastUsed', header: 'Last used', width: 160, render: (item: Contact) => (
                          <span className="text-sm text-muted-foreground">{item.lastUsed || '—'}</span>
                        )},
                        { key: 'eng', header: 'Engagement', width: 180, render: (item: Contact) => (
                          <div className="text-sm">
                            <div className="flex items-center gap-2"><EnvelopeIcon className="w-3 h-3" /><span>{item.opens} opens</span></div>
                            <div className="flex items-center gap-2"><ChartBarIcon className="w-3 h-3" /><span>{item.clicks} clicks</span></div>
                          </div>
                        )},
                        { key: 'actions', header: 'Actions', width: 100, render: (item: Contact) => (
                          <div className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" aria-label="Contact actions" title="Contact actions">•••</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setEditing(item); setFormName(item.name); setFormEmail(item.email); setFormCompany(item.company || ''); setFormStatus(item.status); setOpenEditor(true); }}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    await validateLead(item.id)
                                    toast.success?.('Validation requested')
                                  } catch (e: any) {
                                    toast.error?.(e?.message || 'Validation failed')
                                  }
                                }}>Validate Email</DropdownMenuItem>
                                <DropdownMenuItem>Edit Tags</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={async () => {
                                  try {
                                    await deleteLead(item.id)
                                    toast.success?.('Lead removed')
                                    void fetchContacts()
                                  } catch (e: any) {
                                    toast.error?.(e?.message || 'Failed to remove lead')
                                  }
                                }}>Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )},
                      ]}
                      getRowKey={(item: Contact) => item.id}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments">
            <Card>
              <CardHeader>
                <CardTitle>Smart Segments</CardTitle>
                <CardDescription>
                  AI-powered audience segmentation for targeted campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['High Engagement', 'New Subscribers', 'At Risk', 'Champions'].map((segment) => (
                    <Card key={segment}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{segment}</h3>
                          <SparklesIcon className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Auto-generated based on behavior patterns
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {Math.floor(Math.random() * 5000)} contacts
                          </Badge>
                          <Button size="sm"><SparklesIcon className="w-4 h-4 mr-2" />Use Segment</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <Card>
              <CardHeader>
                <CardTitle>Tag Management</CardTitle>
                <CardDescription>
                  Organize contacts with smart tagging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['VIP', 'Enterprise', 'SMB', 'Startup', 'Tech', 'Marketing', 'Sales', 'Decision Maker'].map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                      <span className="ml-2 text-xs opacity-60">
                        {Math.floor(Math.random() * 1000)}
                      </span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>
                  Intelligent recommendations for your contact strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Re-engagement Opportunity</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        234 contacts haven't engaged in 30 days. Consider a win-back campaign.
                      </p>
                      <Button size="sm" className="mt-2"><EnvelopeIcon className="w-4 h-4 mr-2" />Create Campaign</Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ChartBarIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">High Performers</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        VIP segment shows 3x higher engagement. Prioritize premium content.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pagination (API-backed when base id is configured) */}
        {DEFAULT_LEAD_BASE_ID && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={cursorStack.length === 0}
              onClick={() => {
                if (cursorStack.length > 0) {
                  const prev = [...cursorStack]
                  const last = prev.pop() || null
                  setCursorStack(prev)
                  setCurrentCursor(last)
                }
              }}
            >Prev</Button>
            <span className="text-sm text-muted-foreground">Cursor-based list</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextCursor}
              onClick={() => {
                if (nextCursor) {
                  setCursorStack((s) => [...s, currentCursor || ''])
                  setCurrentCursor(nextCursor)
                }
              }}
            >Next</Button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedContacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4"
          >
            <span className="text-sm font-medium">
              {selectedContacts.length} contacts selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline"><TagIcon className="w-4 h-4 mr-2" />Add Tags</Button>
              <Button size="sm" variant="outline"><EnvelopeIcon className="w-4 h-4 mr-2" />Send Campaign</Button>
              <Button size="sm" variant="outline"><ArrowDownTrayIcon className="w-4 h-4 mr-2" />Export</Button>
              <Button size="sm" className="bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/25"><TrashIcon className="w-4 h-4 mr-2" />Delete</Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </PageShell>
  );
};

// Load contacts from API if default base id configured
// and handle save/import wiring
// Effects placed after component for clarity
// Note: This relies on LeadsApiFactory base axios config (/api/v1)
// and VITE_API_BASE in env for cross-origin.