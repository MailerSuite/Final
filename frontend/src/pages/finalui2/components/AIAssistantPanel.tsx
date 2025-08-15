import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  LightBulbIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you create campaigns, write email content, analyze metrics, and more. What would you like to work on?",
      timestamp: new Date(),
      suggestions: [
        'Create a new campaign',
        'Generate email template',
        'Analyze campaign performance',
        'Segment contacts'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamMode, setStreamMode] = useState(true);
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('ai-panel-width');
    return saved ? Number(saved) : 420;
  });
  const [isResizing, setIsResizing] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist messages and settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-assistant-messages');
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : new Date() })));
        }
      }
      const savedModel = localStorage.getItem('ai-assistant-model');
      const savedTemp = localStorage.getItem('ai-assistant-temperature');
      const savedStream = localStorage.getItem('ai-assistant-stream');
      if (savedModel) setModel(savedModel);
      if (savedTemp) setTemperature(Number(savedTemp));
      if (savedStream) setStreamMode(savedStream === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ai-assistant-messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('ai-assistant-model', model);
      localStorage.setItem('ai-assistant-temperature', String(temperature));
      localStorage.setItem('ai-assistant-stream', String(streamMode));
    } catch {}
  }, [model, temperature, streamMode]);

  useEffect(() => {
    try {
      localStorage.setItem('ai-panel-width', String(panelWidth));
    } catch {}
  }, [panelWidth]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Model: ${model} • Temp: ${temperature}\n\nI'm processing your request. This is a demo response. In production, this would connect to the AI backend.${streamMode ? ' (streaming enabled)' : ''}`,
        timestamp: new Date(),
        suggestions: ['Tell me more', 'Show examples', 'Next steps']
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  const handleStop = () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ model, temperature, streamMode, messages }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setMessages([]);
  };

  // Resize handlers
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 320), 720);
      setPanelWidth(newWidth);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const quickActions = [
    { icon: DocumentTextIcon, label: 'Template', action: 'Generate email template' },
    { icon: ChartBarIcon, label: 'Analytics', action: 'Show campaign metrics' },
    { icon: UserGroupIcon, label: 'Segment', action: 'Create audience segment' },
    { icon: LightBulbIcon, label: 'Ideas', action: 'Suggest campaign ideas' },
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-panel border-l border-border bg-background" style={{ width: panelWidth }}>
      {/* Resize handle */}
      <div
        className="resize-handle"
        onMouseDown={() => setIsResizing(true)}
      />

      <div className="assistant-header border-b border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="header-title">
          <div className="bot-avatar">
            <Bot className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold">AI Assistant</h2>
          <Badge variant="outline" className="ml-2 gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
          </Badge>
        </div>
        <div className="header-actions">
          <select
            className="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="claude-3">Claude 3</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
          <label className="toggle">
            <input type="checkbox" checked={streamMode} onChange={(e) => setStreamMode(e.target.checked)} />
            <span>Stream</span>
          </label>
          <div className="temp">
            <span className="temp-label">Temp</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
            <span className="temp-value">{temperature.toFixed(1)}</span>
          </div>
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
          <Input
            placeholder="Quick prompt (e.g., Summarize last campaign performance)"
            className="h-9"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button variant="outline" size="sm" className="h-9" onClick={handleSend} disabled={!input.trim()}>Ask</Button>
        </div>
      </div>

      <div className="border-b border-border/60 bg-muted/20 px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => setInput(action.action)}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'assistant' ? (
                  <SparklesIcon className="w-5 h-5" />
                ) : (
                  <div className="user-avatar">U</div>
                )}
              </div>
              <div className="message-content">
                <div className="message-text shadow-sm border border-border/60">{message.content}</div>
                {message.suggestions && (
                  <div className="suggestions">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="suggestion-chip border border-border"
                        onClick={() => setInput(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant">
              <div className="message-avatar">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div className="message-content">
                <div className="ai-thinking">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="input-container border-t border-border">
        <button className="attach-btn" title="Attach">
          <ArrowPathIcon className="w-5 h-5" />
        </button>
        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="message-input border border-border"
        />
        {isTyping ? (
          <button onClick={handleStop} className="send-btn destructive" title="Stop">
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="send-btn"
            title="Send"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      <style>{`
        .ai-assistant-panel {
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          max-width: 720px;
          background: hsl(var(--background));
          border-left: 1px solid hsl(var(--border));
          display: flex;
          flex-direction: column;
          z-index: 50;
          animation: slideIn 0.3s ease-out;
        }

        .resize-handle {
          position: absolute;
          left: -4px;
          top: 0;
          width: 8px;
          height: 100%;
          cursor: col-resize;
          background: transparent;
        }

        .assistant-header {
          padding: 20px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-title h2 {
          font-size: 18px;
          font-weight: 600;
        }

        .bot-avatar {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(34,211,238,0.15), rgba(59,130,246,0.15));
          border: 1px solid rgba(34,211,238,0.35);
          color: rgb(34,211,238);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .model-select {
          height: 30px;
          background: var(--ai-bg-elevated);
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          color: var(--ai-text-primary);
          font-size: 12px;
          padding: 0 8px;
        }

        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--ai-text-secondary);
          font-size: 12px;
        }

        .temp { display: inline-flex; align-items: center; gap: 6px; }
        .temp-label { font-size: 12px; color: var(--ai-text-secondary); }
        .temp-value { font-size: 12px; color: var(--ai-text-primary); min-width: 28px; text-align: right; }

        .icon-btn {
          padding: 6px;
          border-radius: var(--ai-radius-md);
          background: transparent;
          border: 1px solid hsl(var(--border));
          color: var(--ai-text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .icon-btn:hover { background: var(--ai-bg-hover); color: var(--ai-text-primary); }

        .close-btn {
          padding: 6px;
          border-radius: var(--ai-radius-md);
          background: transparent;
          border: none;
          color: var(--ai-text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: var(--ai-bg-hover);
          color: var(--ai-text-primary);
        }

        .quick-actions {
          padding: 16px;
          display: flex;
          gap: 8px;
          border-bottom: 1px solid hsl(var(--border));
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 12px;
          color: var(--ai-text-secondary);
        }

        .quick-action-btn:hover {
          color: var(--ai-text-primary);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .message {
          display: flex;
          gap: 12px;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--ai-radius-md);
          background: var(--ai-bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ai-accent);
          flex-shrink: 0;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--ai-radius-md);
          background: var(--ai-gradient-2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .message-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .message-text {
          padding: 12px 16px;
          background: var(--ai-bg-elevated);
          border-radius: var(--ai-radius-lg);
          font-size: 14px;
          line-height: 1.5;
        }

        .message.user .message-text {
          background: var(--ai-accent-light);
          color: var(--ai-text-primary);
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .suggestion-chip {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid hsl(var(--border));
          border-radius: var(--ai-radius-xl);
          font-size: 12px;
          color: var(--ai-text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-chip:hover {
          background: var(--ai-bg-hover);
          color: var(--ai-text-primary);
          border-color: var(--ai-accent);
        }

        .input-container {
          padding: 20px;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .attach-btn {
          padding: 8px;
          border-radius: var(--ai-radius-md);
          background: transparent;
          border: none;
          color: var(--ai-text-tertiary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .attach-btn:hover {
          color: var(--ai-text-primary);
        }

        .message-input {
          flex: 1;
          padding: 10px 16px;
          background: var(--ai-bg-elevated);
          border: 1px solid hsl(var(--border));
          border-radius: var(--ai-radius-lg);
          color: var(--ai-text-primary);
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .message-input:focus {
          border-color: var(--ai-accent);
        }

        .send-btn {
          padding: 8px;
          border-radius: var(--ai-radius-md);
          background: var(--ai-accent);
          border: none;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .send-btn.destructive { background: hsl(0 84% 60%); }

        .send-btn:hover:not(:disabled) {
          background: var(--ai-accent-hover);
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};