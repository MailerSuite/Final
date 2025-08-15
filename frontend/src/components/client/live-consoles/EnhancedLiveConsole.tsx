import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal,
  Play,
  Pause,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface ConsoleMessage {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success' | 'debug'
  source: string
  message: string
  details?: any
  metadata?: {
    ip?: string
    duration?: number
    size?: number
    [key: string]: any
  }
}

interface EnhancedLiveConsoleProps {
  title?: string
  messages?: ConsoleMessage[]
  onClear?: () => void
  onExport?: () => void
  className?: string
  height?: number | string
  autoScroll?: boolean
  showTimestamp?: boolean
  showSource?: boolean
  enableSearch?: boolean
  enableFilters?: boolean
  compact?: boolean
}

const levelConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  warning: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  debug: { icon: Terminal, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/30' }
}

export function EnhancedLiveConsole({
  title = 'Live Console',
  messages = [],
  onClear,
  onExport,
  className,
  height = 400,
  autoScroll = true,
  showTimestamp = true,
  showSource = true,
  enableSearch = true,
  enableFilters = true,
  compact = false
}: EnhancedLiveConsoleProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(['info', 'warning', 'error', 'success', 'debug'])
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && isPlaying && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll, isPlaying])

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchQuery === '' || 
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = selectedLevels.has(msg.level)
    return matchesSearch && matchesLevel
  })

  const handleCopyMessage = async (message: ConsoleMessage) => {
    const text = `[${message.timestamp.toISOString()}] [${message.level.toUpperCase()}] ${message.source}: ${message.message}`
    await navigator.clipboard.writeText(text)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleLevel = (level: string) => {
    const newLevels = new Set(selectedLevels)
    if (newLevels.has(level)) {
      newLevels.delete(level)
    } else {
      newLevels.add(level)
    }
    setSelectedLevels(newLevels)
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <Card className={cn(
      'bg-background/50 border-border',
      isFullscreen && 'fixed inset-4 z-50',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            {title}
            <Badge variant="outline" className="ml-2 border-border">
              {filteredMessages.length} messages
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            {enableSearch && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-48 pl-8 bg-black border-border text-white text-sm"
                />
              </div>
            )}

            {/* Filters */}
            {enableFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-border">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border-border">
                  <DropdownMenuLabel>Log Levels</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-muted" />
                  {Object.keys(levelConfig).map(level => (
                    <DropdownMenuCheckboxItem
                      key={level}
                      checked={selectedLevels.has(level)}
                      onCheckedChange={() => toggleLevel(level)}
                      className="capitalize"
                    >
                      {level}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Separator orientation="vertical" className="h-6" />

            {/* Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-muted-foreground hover:text-white"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="text-muted-foreground hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-muted-foreground hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea 
          className="w-full" 
          style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
          ref={scrollAreaRef}
        >
          <div className="p-4 font-mono text-sm">
            <AnimatePresence initial={false}>
              {filteredMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  No messages to display
                </motion.div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const config = levelConfig[msg.level]
                  const Icon = config.icon
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: idx * 0.01 }}
                      className={cn(
                        'group flex items-start gap-3 mb-2 p-2 rounded-lg hover:bg-card/30 transition-colors',
                        compact && 'gap-2 mb-1 p-1'
                      )}
                    >
                      {/* Icon */}
                      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
                      
                      {/* Timestamp */}
                      {showTimestamp && (
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      )}
                      
                      {/* Level Badge */}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs flex-shrink-0',
                          config.bg,
                          config.border,
                          config.color
                        )}
                      >
                        {msg.level}
                      </Badge>
                      
                      {/* Source */}
                      {showSource && (
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          [{msg.source}]
                        </span>
                      )}
                      
                      {/* Message */}
                      <span className="text-muted-foreground flex-1 break-all">
                        {msg.message}
                      </span>
                      
                      {/* Metadata */}
                      {msg.metadata && (
                        <div className="flex gap-2 flex-shrink-0">
                          {msg.metadata.duration && (
                            <Badge variant="outline" className="text-xs border-border">
                              {msg.metadata.duration}ms
                            </Badge>
                          )}
                          {msg.metadata.size && (
                            <Badge variant="outline" className="text-xs border-border">
                              {(msg.metadata.size / 1024).toFixed(2)}KB
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMessage(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white p-1 h-6"
                      >
                        {copiedId === msg.id ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Status Bar */}
        <div className="border-t border-border px-4 py-2 bg-black/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                Status: 
                <Badge variant="outline" className="ml-1 border-green-500/30 text-green-400">
                  {isPlaying ? 'Live' : 'Paused'}
                </Badge>
              </span>
              <span>Auto-scroll: {autoScroll ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Total: {messages.length}</span>
              <span>Filtered: {filteredMessages.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}