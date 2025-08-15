import React, { useEffect, useRef, useState } from 'react'
import { 
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  BugAntIcon,
  CreditCardIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { LifeBuoy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SupportPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const SupportPanel: React.FC<SupportPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'sup-1',
    role: 'assistant',
    content: "Hi! I'm your Support Assistant. I can help you create tickets, report issues, answer billing questions, or connect you to our docs.",
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('support-panel-width')
    return saved ? Number(saved) : 420
  })
  const [isResizing, setIsResizing] = useState(false)
  const typingTimeoutRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('support-messages')
      if (saved) {
        const parsed: Message[] = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('support-messages', JSON.stringify(messages)) } catch {}
  }, [messages])

  useEffect(() => {
    try { localStorage.setItem('support-panel-width', String(panelWidth)) } catch {}
  }, [panelWidth])

  // Resize handlers
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 320), 720)
      setPanelWidth(newWidth)
    }
    const onUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isResizing])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSend = () => {
    if (!input.trim()) return
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = window.setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Thanks! I have logged your request. Our support will follow up shortly. Meanwhile, you can export this conversation or open a ticket from quick actions below.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, reply])
      setIsTyping(false)
      typingTimeoutRef.current = null
    }, 900)
  }

  const handleStop = () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    setIsTyping(false)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ messages }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `support-chat-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const quickActions = [
    { icon: DocumentTextIcon, label: 'Create Ticket', text: 'Please create a new support ticket for my issue.' },
    { icon: BugAntIcon, label: 'Report Bug', text: 'I found a bug: ' },
    { icon: CreditCardIcon, label: 'Billing Question', text: 'I have a billing question: ' },
    { icon: PhoneIcon, label: 'Contact Support', text: 'Please connect me to a support agent.' },
  ]

  if (!isOpen) return null

  return (
    <div className="support-panel border-l border-border bg-background" style={{ width: panelWidth }}>
      <div className="resize-handle" onMouseDown={() => setIsResizing(true)} />

      <div className="support-header border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="header-title">
          <div className="support-avatar">
            <LifeBuoy className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold">Support</h2>
          <Badge variant="outline" className="ml-2 gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
          </Badge>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="Export" onClick={handleExport}>
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="close-btn" title="Close">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border/60 p-3 bg-background/60">
        <div className="flex items-center gap-2">
          <Input placeholder="Search help center or docs..." className="h-9" />
          <Button variant="outline" size="sm" className="h-9">New Ticket</Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((qa, i) => (
            <Button key={i} variant="outline" size="sm" className="justify-start" onClick={() => setInput(qa.text)}>
              <qa.icon className="w-4 h-4 mr-2" />
              {qa.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="messages-container">
          {messages.map(m => (
            <div key={m.id} className={`message ${m.role}`}>
              <div className="message-avatar">
                {m.role === 'assistant' ? (
                  <LifeBuoy className="w-4 h-4" />
                ) : (
                  <div className="user-avatar">U</div>
                )}
              </div>
              <div className="message-content">
                <div className="message-text shadow-sm border border-border/60">{m.content}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant">
              <div className="message-avatar">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="message-content">
                <div className="ai-thinking">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Help & Resources */}
        <div className="p-3 space-y-3">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Help Center</CardTitle>
              <CardDescription className="text-xs">Common questions and answers</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm">How do I create a support ticket?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Go to Support → New Ticket or click the New Ticket button above. Provide a clear subject and steps to reproduce.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm">Where can I see system status?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Visit our status page in Settings → System Status or check the status badge in the navbar.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-sm">Billing & invoices</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Navigate to Settings → Billing to download invoices, update payment methods, or change plans.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact Support</CardTitle>
              <CardDescription className="text-xs">We usually reply within a few hours</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" className="gap-1"><PhoneIcon className="w-4 h-4" /> Live Chat</Button>
              <Button size="sm" variant="outline">Email</Button>
              <Button size="sm" variant="outline">Docs</Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="input-container border-top">
        <input
          type="text"
          placeholder="Describe your issue..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="message-input border border-border"
        />
        {isTyping ? (
          <button onClick={handleStop} className="send-btn destructive" title="Stop">Stop</button>
        ) : (
          <button onClick={handleSend} disabled={!input.trim()} className="send-btn" title="Send">
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <style>{`
        .support-panel { position: fixed; right: 0; top: 0; height: 100vh; max-width: 720px; z-index: 50; display: flex; flex-direction: column; background: hsl(var(--background)); }
        .resize-handle { position: absolute; left: -4px; top: 0; width: 8px; height: 100%; cursor: col-resize; background: transparent; }
        .support-header { padding: 20px; display: flex; align-items: center; justify-content: space-between; }
        .header-title { display: flex; align-items: center; gap: 10px; }
        .support-avatar { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.08)); border: 1px solid rgba(59,130,246,0.35); color: rgb(59,130,246); }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .icon-btn { padding: 6px; border-radius: 8px; background: transparent; border: 1px solid hsl(var(--border)); color: var(--ai-text-secondary); display: inline-flex; align-items: center; justify-content: center; }
        .icon-btn:hover { background: var(--ai-bg-hover); color: var(--ai-text-primary); }
        .close-btn { padding: 6px; border-radius: 8px; background: transparent; border: none; color: var(--ai-text-secondary); cursor: pointer; }
        .close-btn:hover { background: var(--ai-bg-hover); color: var(--ai-text-primary); }
        .quick-actions { padding: 12px 16px; display: flex; gap: 8px; flex-wrap: wrap; }
        .quick-action-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 10px; color: var(--ai-text-secondary); }
        .quick-action-btn:hover { color: var(--ai-text-primary); }
        .messages-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .message { display: flex; gap: 12px; }
        .message.user { flex-direction: row-reverse; }
        .message-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--ai-bg-elevated); display: flex; align-items: center; justify-content: center; color: var(--ai-accent); flex-shrink: 0; }
        .user-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--ai-gradient-2); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
        .message-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .message-text { padding: 12px 16px; background: var(--ai-bg-elevated); border-radius: 12px; font-size: 14px; }
        .message.user .message-text { background: var(--ai-accent-light); color: var(--ai-text-primary); }
        .ai-thinking { display: flex; gap: 6px; }
        .ai-thinking span { width: 6px; height: 6px; border-radius: 9999px; background: var(--ai-accent); animation: bounce 1s infinite; opacity: 0.8; }
        .ai-thinking span:nth-child(2) { animation-delay: 150ms; }
        .ai-thinking span:nth-child(3) { animation-delay: 300ms; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.6 } 40% { transform: scale(1); opacity: 1 } }
        .input-container { padding: 20px; border-top: 1px solid hsl(var(--border)); display: flex; align-items: center; gap: 12px; }
        .message-input { flex: 1; padding: 10px 16px; background: var(--ai-bg-elevated); border: 1px solid hsl(var(--border)); border-radius: 12px; color: var(--ai-text-primary); font-size: 14px; outline: none; }
        .send-btn { padding: 8px; border-radius: 8px; background: var(--ai-accent); border: none; color: white; cursor: pointer; transition: all 0.2s ease; }
        .send-btn.destructive { background: hsl(0 84% 60%); }
      `}</style>
    </div>
  )
}

export default SupportPanel
