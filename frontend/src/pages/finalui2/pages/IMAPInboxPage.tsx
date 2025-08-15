import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import PageConsole from '@/components/ui/PageConsole'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
// Removed design-system kit; using Shadcn components only
import {
  InboxIcon,
  ServerStackIcon,
  KeyIcon,
  AtSymbolIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  WifiIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  StarIcon,
  TrashIcon,
  ArchiveBoxIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  TagIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CalendarDaysIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { apiClient } from '@/http/stable-api-client'
import { listImap, getFolderMessages, retrieveEmails } from '@/api/imap'
import type { IMAPAccount, IMAPMessage } from '@/types/imap'
import { BlacklistApiFactory } from '@/api/blacklist-api'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
// Inline LiveIndicator using shadcn primitives to remove design-system dependency

// Design system CSS injection for smooth transitions
const designSystemStyles = `
  /* Page transitions */
  .page-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .tab-transition {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Glass morphism effects */
  .glass-panel {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  /* Neon glow effects */
  .neon-glow {
    filter: drop-shadow(0 0 20px currentColor);
  }
  
  /* Smooth hover transitions */
  .smooth-hover {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .smooth-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #22d3ee 0%, #60a5fa 50%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Shimmer animation for loading states */
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  /* Card hover effects */
  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = designSystemStyles;
  if (!document.head.querySelector('style[data-design-system]')) {
    styleElement.setAttribute('data-design-system', 'true');
    document.head.appendChild(styleElement);
  }
}

interface MessagePreview {
  id: string;
  from: string;
  subject: string;
  time: string;
  read?: boolean;
  starred?: boolean;
  hasAttachment?: boolean;
  snippet?: string;
  avatar?: string;
  labels?: string[];
}

interface Folder {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color?: string;
}

export default function IMAPInboxPage(props: { initialTab?: string } = {}) {
  const [host, setHost] = useState('')
  const [port, setPort] = useState('993')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [accounts, setAccounts] = useState<IMAPAccount[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedMessage, setSelectedMessage] = useState<MessagePreview | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [viewMode, setViewMode] = useState<'list' | 'split'>('split')
  // Optional initial tab support via router adapter
  const { initialTab } = props
  // Stop conditions and threading thresholds (UI only)
  const [stopConditions, setStopConditions] = useState({
    maxErrors: 100,
    maxInvalid: 500,
    errorRatePct: 20,
    timeLimitMin: 60,
    pauseOnBlacklist: true,
    stopOnBounceSpike: true,
  })
  const [threadingCfg, setThreadingCfg] = useState({
    maxThreads: 32,
    perHost: 4,
    perIp: 8,
    rpsLimit: 30,
  })
  useEffect(() => {
    try {
      const sc = localStorage.getItem('imap_stop_conditions')
      const th = localStorage.getItem('imap_threading_cfg')
      if (sc) setStopConditions({ ...stopConditions, ...JSON.parse(sc) })
      if (th) setThreadingCfg({ ...threadingCfg, ...JSON.parse(th) })
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const saveStopConditions = () => {
    localStorage.setItem('imap_stop_conditions', JSON.stringify(stopConditions))
  }
  const saveThreadingCfg = () => {
    localStorage.setItem('imap_threading_cfg', JSON.stringify(threadingCfg))
  }

  type IMAPProvider = {
    name: string
    server: string
    port: number
    ssl: boolean
    auth?: string
    features?: string[]
    icon: React.ComponentType<{ className?: string }>
    color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'gray'
  }

  const providers: IMAPProvider[] = [
    { name: 'Gmail', server: 'imap.gmail.com', port: 993, ssl: true, auth: 'OAuth2/App Password', features: ['Labels', 'IDLE'], icon: GlobeAltIcon, color: 'red' },
    { name: 'Outlook', server: 'outlook.office365.com', port: 993, ssl: true, auth: 'OAuth2/Password', features: ['Exchange', 'IDLE'], icon: ServerStackIcon, color: 'blue' },
    { name: 'Yahoo', server: 'imap.mail.yahoo.com', port: 993, ssl: true, auth: 'App Password', features: ['IDLE'], icon: InboxIcon, color: 'purple' },
    { name: 'iCloud', server: 'imap.mail.me.com', port: 993, ssl: true, auth: 'App Password', features: ['IDLE'], icon: CloudArrowUpIcon, color: 'yellow' },
    { name: 'Zoho', server: 'imap.zoho.com', port: 993, ssl: true, auth: 'OAuth2/Password', features: ['IDLE'], icon: GlobeAltIcon, color: 'green' },
    { name: 'GMX', server: 'imap.gmx.com', port: 993, ssl: true, auth: 'Password', features: ['IDLE'], icon: GlobeAltIcon, color: 'gray' },
  ]

  const handleProviderSelect = (providerName: string) => {
    const p = providers.find(x => x.name === providerName)
    if (!p) return
    setSelectedProvider(providerName)
    setHost(p.server)
    setPort(String(p.port))
  }

  const folders: Folder[] = [
    { id: 'inbox', name: 'Inbox', icon: InboxIcon, count: messages.length, color: 'blue' },
    { id: 'sent', name: 'Sent', icon: PaperAirplaneIcon, count: 12, color: 'green' },
    { id: 'draft', name: 'Drafts', icon: DocumentTextIcon, count: 3, color: 'yellow' },
    { id: 'starred', name: 'Starred', icon: StarIcon, count: 8, color: 'orange' },
    { id: 'archive', name: 'Archive', icon: ArchiveBoxIcon, count: 156, color: 'gray' },
    { id: 'trash', name: 'Trash', icon: TrashIcon, count: 24, color: 'red' },
    { id: 'spam', name: 'Spam', icon: ShieldCheckIcon, count: 7, color: 'red' },
  ]

  const filteredMessages = messages.filter(message =>
    !searchQuery ||
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.from.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchStatus = async () => {
    try {
      // Load accounts first if not present
      if (!activeAccountId) {
        const sid = localStorage.getItem('session_id') || ''
        try {
          const list = await listImap(sid)
          setAccounts(list || [])
          if (list && list.length > 0) setActiveAccountId(list[0].id)
        } catch { /* ignore */ }
      }

      // If we have an active account, try to retrieve messages for the selected folder
      if (activeAccountId) {
        if (selectedFolder.toLowerCase() === 'inbox') {
          const data = await retrieveEmails(activeAccountId)
          const msgs = (data?.messages || []).map((m: unknown, index: number) => ({
            id: String(m.uid ?? index),
            from: m.sender || 'unknown@example.com',
            subject: m.subject || '(no subject)',
            time: m.received_at ? new Date(m.received_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
            read: false,
            starred: false,
            hasAttachment: false,
            snippet: m.preview || '',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.sender || 'NA')}`,
            labels: [],
          }))
          setMessages(msgs)
        } else {
          const folder = selectedFolder.toUpperCase()
          const data: IMAPMessage[] = await getFolderMessages(activeAccountId, folder)
          const msgs = (data || []).map((m: unknown, index: number) => ({
            id: String(m.uid ?? index),
            from: m.sender || 'unknown@example.com',
            subject: m.subject || '(no subject)',
            time: m.date ? new Date(m.date).toLocaleTimeString() : new Date().toLocaleTimeString(),
            read: !!m.is_read,
            starred: false,
            hasAttachment: !!m.has_attachments,
            snippet: m.body_preview || '',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.sender || 'NA')}`,
            labels: [],
          }))
          setMessages(msgs)
        }
      }
    } catch { }
  }

  const connect = async () => {
    setLoading(true)
    try {
      await apiClient.post('/imap/start', {
        host, port: Number(port), username, password, use_ssl: true,
      })
      toast.success('IMAP started')
      await fetchStatus()
    } catch (e: unknown) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const stop = async () => {
    try {
      await apiClient.post('/imap/stop', {})
      toast.success('IMAP stopped')
      setMessages([])
    } catch { }
  }

  useEffect(() => {
    const id = setInterval(fetchStatus, 5000)
    return () => clearInterval(id)
  }, [])

  const connectionStatus: 'online' | 'offline' | 'connecting' | 'error' = loading
    ? 'connecting'
    : messages.length > 0
      ? 'online'
      : 'offline'

  return (
    <TooltipProvider>
      <PageShell
        title="Email Client"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <InboxIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle="Professional email management with real-time monitoring"
      >
        <motion.div
          className="relative z-10 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          <Tabs
            defaultValue={
              initialTab === 'host-config' ||
                initialTab === 'live-test-results' ||
                initialTab === 'conditions'
                ? 'setup'
                : 'email'
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md tab-transition">
              <TabsTrigger value="email" className="flex items-center gap-2 tab-transition">
                <InboxIcon className="w-4 h-4" />
                Email Client
              </TabsTrigger>
              <TabsTrigger value="setup" className="flex items-center gap-2 tab-transition">
                <ServerStackIcon className="w-4 h-4" />
                Connection Setup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-6">
              {/* Email Client Interface */}
              <div className="grid grid-cols-12 gap-6 h-[800px]">
                {/* Sidebar - Folders */}
                <div className="col-span-3">
                  <Card className="h-full card-hover glass-panel">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderIcon className="w-5 h-5 text-primary" />
                          Folders
                        </CardTitle>
                        <Badge variant={connectionStatus === 'online' ? 'default' : connectionStatus === 'connecting' ? 'secondary' : 'outline'} className="text-xs">
                          {connectionStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-1">
                          {folders.map((folder) => (
                            <motion.div
                              key={folder.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Button
                                variant={selectedFolder === folder.id ? "default" : "ghost"}
                                className="w-full justify-start h-12 smooth-hover"
                                onClick={() => setSelectedFolder(folder.id)}
                              >
                                <folder.icon className="w-4 h-4 mr-3" />
                                <span className="flex-1 text-left">{folder.name}</span>
                                {folder.count > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    {folder.count}
                                  </Badge>
                                )}
                              </Button>
                            </motion.div>
                          ))}
                        </div>

                        <Separator className="my-6" />

                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Quick Actions
                          </Label>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                            Compose
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                            Advanced Search
                          </Button>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Message List */}
                <div className={viewMode === 'split' ? 'col-span-5' : 'col-span-9'}>
                  <Card className="h-full card-hover glass-panel">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <CardTitle className="capitalize">{selectedFolder}</CardTitle>
                          <Badge variant="outline">{filteredMessages.length} messages</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search messages..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 w-64"
                            />
                          </div>
                          <Select value={activeAccountId} onValueChange={setActiveAccountId}>
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Select IMAP account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.email} — {a.imap_server}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'list' ? 'split' : 'list')}
                          >
                            {viewMode === 'list' ? 'Split View' : 'List View'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ScrollArea className="h-[680px]">
                        {filteredMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <InboxIcon className="w-12 h-12 mb-4 opacity-50" />
                            <p>No messages found</p>
                            {!searchQuery && (
                              <p className="text-sm mt-2">Connect to your email account to see messages</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {filteredMessages.map((message) => (
                              <motion.div
                                key={message.id}
                                whileHover={{ scale: 1.01, y: -2 }}
                                whileTap={{ scale: 0.99 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className={`p-4 rounded-lg border cursor-pointer smooth-hover ${selectedMessage?.id === message.id
                                  ? 'bg-primary/5 border-primary'
                                  : 'hover:bg-muted/50'
                                  } ${!message.read ? 'bg-blue-50/50 border-blue-200' : ''}`}
                                onClick={() => setSelectedMessage(message)}
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-10 h-10 flex-shrink-0">
                                    <AvatarImage src={message.avatar} alt={message.from} />
                                    <AvatarFallback>
                                      {message.from.split('@')[0].substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <p className={`font-medium truncate ${!message.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                          {message.from.split('@')[0]}
                                        </p>
                                        {message.hasAttachment && (
                                          <PaperClipIcon className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {message.starred && (
                                          <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                                        )}
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          {message.time}
                                        </span>
                                      </div>
                                    </div>

                                    <p className={`text-sm truncate mb-2 ${!message.read ? 'font-medium' : 'text-muted-foreground'}`}>
                                      {message.subject}
                                    </p>

                                    {message.snippet && (
                                      <p className="text-xs text-muted-foreground truncate mb-2">
                                        {message.snippet}
                                      </p>
                                    )}

                                    {message.labels && message.labels.length > 0 && (
                                      <div className="flex gap-1">
                                        {message.labels.map((label) => (
                                          <Badge key={label} variant="secondary" className="text-xs">
                                            {label}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-1">
                                          <StarIcon className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Star message</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="p-1">
                                          <ArchiveBoxIcon className="w-4 h-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Archive message</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Message Viewer */}
                {viewMode === 'split' && (
                  <div className="col-span-4">
                    <Card className="h-full card-hover glass-panel">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Message</CardTitle>
                          {selectedMessage && (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <StarIcon className="w-4 h-4 mr-2" />
                                Star
                              </Button>
                              <Button variant="outline" size="sm">
                                <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                                Archive
                              </Button>
                              <Button variant="outline" size="sm">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {selectedMessage ? (
                          <ScrollArea className="h-[680px]">
                            <div className="space-y-6">
                              {/* Message Header */}
                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={selectedMessage.avatar} alt={selectedMessage.from} />
                                    <AvatarFallback>
                                      {selectedMessage.from.split('@')[0].substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-semibold">{selectedMessage.from}</p>
                                    <p className="text-sm text-muted-foreground">to: you@example.com</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {selectedMessage.time} • <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                                      {new Date().toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-xl font-semibold mb-2">{selectedMessage.subject}</h3>
                                  {selectedMessage.labels && selectedMessage.labels.length > 0 && (
                                    <div className="flex gap-1 mb-3">
                                      {selectedMessage.labels.map((label) => (
                                        <Badge key={label} variant="outline">
                                          <TagIcon className="w-3 h-3 mr-1" />
                                          {label}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Separator />

                              {/* Message Content */}
                              <div className="prose prose-sm max-w-none">
                                <p>
                                  This is a sample email message content. In a real implementation,
                                  this would display the actual email content retrieved from the IMAP server.
                                </p>
                                <p>
                                  The content could include HTML formatting, images, and attachments.
                                  Security considerations would apply when rendering external content.
                                </p>
                                {selectedMessage.hasAttachment && (
                                  <div className="mt-6 p-4 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                      <PaperClipIcon className="w-4 h-4" />
                                      <span className="font-medium">Attachments</span>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                      <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                        <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm">document.pdf</span>
                                        <span className="text-xs text-muted-foreground ml-auto">2.3 MB</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Separator />

                              {/* Reply Actions */}
                              <div className="flex gap-2">
                                <Button>
                                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                                  Reply
                                </Button>
                                <Button variant="outline">
                                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                                  Reply All
                                </Button>
                                <Button variant="outline">
                                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                                  Forward
                                </Button>
                              </div>
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <DocumentTextIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No message selected</p>
                            <p className="text-sm">Choose a message from the list to view its content</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-6 mt-6">
              {/* Live Monitor Console */}
              <PageConsole
                title="IMAP Live Monitor"
                source="imap"
                height="md"
                logCategories={["STATUS", "THREADS", "AUTH", "ERROR", "FETCH"]}
                showSearch
                showControls
                autoConnect
              />

              {/* Connection Setup */}
              <div className="grid grid-cols-4 gap-6">
                {/* Connection Panel */}
                <div className="col-span-3 space-y-6">
                  {/* Provider Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ServerStackIcon className="w-5 h-5 text-primary" />
                        Email Provider Setup
                      </CardTitle>
                      <CardDescription>
                        Select your email provider for quick configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {providers.map((provider) => (
                          <motion.div key={provider.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Card
                              className={`cursor-pointer transition-all border-2 ${selectedProvider === provider.name
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                                }`}
                              onClick={() => handleProviderSelect(provider.name)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <provider.icon className="w-8 h-8 text-primary" />
                                  <div className="flex-1">
                                    <div className="font-semibold">{provider.name}</div>
                                    <div className="text-sm text-muted-foreground">{provider.server}</div>
                                  </div>
                                  {selectedProvider === provider.name && (
                                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                {provider.features && (
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    {provider.features.map((feature) => (
                                      <Badge key={feature} variant="secondary" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connection Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <KeyIcon className="w-5 h-5 text-primary" />
                        Connection Settings
                      </CardTitle>
                      <CardDescription>
                        Configure your IMAP server connection details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="connection" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="connection">Connection</TabsTrigger>
                          <TabsTrigger value="stop">Stop Conditions</TabsTrigger>
                          <TabsTrigger value="threads">Threading</TabsTrigger>
                        </TabsList>

                        <TabsContent value="connection" className="space-y-4 mt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="host">Server Host</Label>
                              <div className="relative">
                                <ServerStackIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="host"
                                  value={host}
                                  onChange={(e) => setHost(e.target.value)}
                                  placeholder="imap.gmail.com"
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="port">Port</Label>
                              <Select value={port} onValueChange={setPort}>
                                <SelectTrigger id="port">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="993">993 (SSL/TLS)</SelectItem>
                                  <SelectItem value="143">143 (STARTTLS)</SelectItem>
                                  <SelectItem value="110">110 (No SSL)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="username">Email Address</Label>
                              <div className="relative">
                                <AtSymbolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="username"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  placeholder="your@email.com"
                                  className="pl-10"
                                  type="email"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="password">Password</Label>
                              <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="password"
                                  type="password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button onClick={connect} disabled={loading || !host || !username}>
                              {loading ? (
                                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <WifiIcon className="w-4 h-4 mr-2" />
                              )}
                              {loading ? 'Connecting...' : 'Connect'}
                            </Button>
                            <Button variant="outline" onClick={stop}>
                              <WifiIcon className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                            <Button variant="outline" onClick={fetchStatus}>
                              <ArrowPathIcon className="w-4 h-4 mr-2" />
                              Refresh
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="stop" className="space-y-4 mt-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="max-errors">Max Errors</Label>
                              <Input
                                id="max-errors"
                                type="number"
                                value={stopConditions.maxErrors}
                                onChange={(e) => setStopConditions({
                                  ...stopConditions,
                                  maxErrors: parseInt(e.target.value || '0')
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-invalid">Max Invalid</Label>
                              <Input
                                id="max-invalid"
                                type="number"
                                value={stopConditions.maxInvalid}
                                onChange={(e) => setStopConditions({
                                  ...stopConditions,
                                  maxInvalid: parseInt(e.target.value || '0')
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="error-rate">Error Rate %</Label>
                              <Input
                                id="error-rate"
                                type="number"
                                value={stopConditions.errorRatePct}
                                onChange={(e) => setStopConditions({
                                  ...stopConditions,
                                  errorRatePct: parseInt(e.target.value || '0')
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="time-limit">Time Limit (min)</Label>
                              <Input
                                id="time-limit"
                                type="number"
                                value={stopConditions.timeLimitMin}
                                onChange={(e) => setStopConditions({
                                  ...stopConditions,
                                  timeLimitMin: parseInt(e.target.value || '0')
                                })}
                              />
                            </div>
                          </div>

                          <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label htmlFor="pause-blacklist" className="text-base">
                                  Pause on Blacklist
                                </Label>
                                <div className="text-[0.8rem] text-muted-foreground">
                                  Automatically pause when blacklist hits are detected
                                </div>
                              </div>
                              <Switch
                                id="pause-blacklist"
                                checked={stopConditions.pauseOnBlacklist}
                                onCheckedChange={(checked) => setStopConditions({
                                  ...stopConditions,
                                  pauseOnBlacklist: checked
                                })}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label htmlFor="stop-bounce" className="text-base">
                                  Stop on Bounce Spike
                                </Label>
                                <div className="text-[0.8rem] text-muted-foreground">
                                  Stop processing when bounce rate spikes
                                </div>
                              </div>
                              <Switch
                                id="stop-bounce"
                                checked={stopConditions.stopOnBounceSpike}
                                onCheckedChange={(checked) => setStopConditions({
                                  ...stopConditions,
                                  stopOnBounceSpike: checked
                                })}
                              />
                            </div>
                          </div>

                          <div className="pt-4">
                            <Button onClick={saveStopConditions} variant="outline">
                              <CheckCircleIcon className="w-4 h-4 mr-2" />
                              Save Stop Conditions
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="threads" className="space-y-4 mt-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="max-threads">Max Threads</Label>
                              <Input
                                id="max-threads"
                                type="number"
                                min={1}
                                max={256}
                                value={threadingCfg.maxThreads}
                                onChange={(e) => setThreadingCfg({
                                  ...threadingCfg,
                                  maxThreads: parseInt(e.target.value || '1')
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="per-host">Per Host</Label>
                              <Input
                                id="per-host"
                                type="number"
                                min={1}
                                max={64}
                                value={threadingCfg.perHost}
                                onChange={(e) => setThreadingCfg({
                                  ...threadingCfg,
                                  perHost: parseInt(e.target.value || '1')
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="per-ip">Per IP</Label>
                              <Input
                                id="per-ip"
                                type="number"
                                min={1}
                                max={128}
                                value={threadingCfg.perIp}
                                onChange={(e) => setThreadingCfg({
                                  ...threadingCfg,
                                  perIp: parseInt(e.target.value || '1')
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="rps-limit">RPS Limit</Label>
                              <Input
                                id="rps-limit"
                                type="number"
                                min={1}
                                max={1000}
                                value={threadingCfg.rpsLimit}
                                onChange={(e) => setThreadingCfg({
                                  ...threadingCfg,
                                  rpsLimit: parseInt(e.target.value || '1')
                                })}
                              />
                            </div>
                          </div>

                          <div className="pt-4">
                            <Button onClick={saveThreadingCfg} variant="outline">
                              <CheckCircleIcon className="w-4 h-4 mr-2" />
                              Save Threading Config
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Panel */}
                <div className="col-span-1 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <WifiIcon className="w-4 h-4 text-primary" />
                        Connection Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              `inline-block w-2 h-2 rounded-full ${
                                connectionStatus === 'online'
                                  ? 'bg-cyan-500 animate-pulse'
                                  : connectionStatus === 'connecting'
                                  ? 'bg-blue-500'
                                  : connectionStatus === 'error'
                                  ? 'bg-fuchsia-500'
                                  : 'bg-muted-foreground'
                              }`
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Health: {Math.min(99, messages.length * 3) || 0}</Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Messages</span>
                          <span className="text-foreground/90">{messages.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Folders</span>
                          <span className="text-foreground/90">{folders.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unread</span>
                          <span className="text-foreground/90">{messages.filter(m => !m.read).length}</span>
                        </div>
                      </div>

                      <Progress value={connectionStatus === 'connecting' ? 50 : connectionStatus === 'online' ? 100 : 0} />
                    </CardContent>
                  </Card>

                  {/* Quick Blacklist Check */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-primary" />
                        Security Check
                      </CardTitle>
                      <CardDescription>
                        Verify domain reputation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IMAPQuickBlacklist />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  )
}

// Small reusable quick blacklist check for IMAP page
const IMAPQuickBlacklist: React.FC = () => {
  const [domain, setDomain] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const onCheck = async () => {
    if (!domain.trim()) return
    setLoading(true); setStatus('Checking...')
    try {
      const api = BlacklistApiFactory()
      const res = await api.checkDomainBlacklistApiV1BlacklistBlacklistDomainDomainGet(domain.trim())
      const data: unknown = (res as any)?.data ?? res
      const bad = Array.isArray(data?.hits) ? data.hits.length : (data?.blacklisted ? 1 : 0)
      setStatus(bad ? `Listed on ${bad} lists` : 'Not listed')
    } catch {
      setStatus('Check failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="imap-bl-domain">Domain</Label>
        <Input id="imap-bl-domain" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onCheck} disabled={loading}>{loading ? 'Checking...' : 'Check'}</Button>
        {status && (
          <Badge variant={status.includes('Not') ? 'outline' : 'destructive'}>{status}</Badge>
        )}
      </div>
    </div>
  )
}
