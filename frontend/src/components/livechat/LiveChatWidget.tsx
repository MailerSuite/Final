/**
 * LiveChat Widget Component
 * Modern floating chat widget with AI bot integration and real-time messaging
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Shield,
  Paperclip,
  Smile,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

import { usePlan } from '@/hooks/usePlan';
import { useAuthStore } from '@/store/auth';
import { useWebSocketPool } from '@/hooks/useWebSocketPool'
import { toast } from 'sonner';

// Types
interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'admin' | 'system';
  timestamp: Date;
  sender_name?: string;
  bot_confidence?: number;
  is_read?: boolean;
}

interface ChatSession {
  id: string;
  session_id: string;
  status: 'pending' | 'active' | 'resolved' | 'closed';
  started_at: Date;
  assigned_admin?: string;
  admin_online?: boolean;
}

interface ChatWidgetStatus {
  is_available: boolean;
  admin_online: boolean;
  estimated_response_time?: string;
  queue_position?: number;
  bot_enabled: boolean;
  greeting_message: string;
}

interface LiveChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  showOnPages?: string[];
  minimumPlan?: string;
  customGreeting?: string;
  autoOpen?: boolean;
  onChatStart?: (sessionId: string) => void;
  onChatEnd?: (sessionId: string) => void;
}

const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  position = 'bottom-right',
  showOnPages = [],
  minimumPlan = 'basic',
  customGreeting,
  autoOpen = false,
  onChatStart,
  onChatEnd
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<ChatWidgetStatus | null>(null);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [chatStarted, setChatStarted] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const wsPool = useWebSocketPool()
  const currentConnRef = useRef<string | null>(null)

  // Hooks
  const { userData, token } = useAuthStore();
  const { hasFeature } = usePlan();

  // Check if chat is available for current plan
  const canUseChat = hasFeature('basic_support') || hasFeature('premium_support');

  // Initialize widget
  useEffect(() => {
    loadWidgetStatus();

    // Auto-open if configured
    if (autoOpen && canUseChat) {
      setIsOpen(true);
    }
  }, [autoOpen, canUseChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load widget availability status
  const loadWidgetStatus = async () => {
    try {
      const response = await fetch('/api/chat/widget/status');
      if (response.ok) {
        const status: ChatWidgetStatus = await response.json();
        setWidgetStatus(status);
      }
    } catch (error) {
      console.error('Failed to load widget status:', error);
    }
  };

  // Start new chat session
  const startChatSession = async () => {
    if (!canUseChat) {
      toast.error('Chat feature not available in your current plan');
      return;
    }

    setIsConnecting(true);

    try {
      const sessionData = {
        guest_name: userData?.username || guestName,
        guest_email: userData?.email || guestEmail,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        initial_message: customGreeting ? undefined : 'Hi, I need help with SGPT'
      };

      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to start chat session');
      }

      const session: ChatSession = await response.json();
      setChatSession(session);
      setChatStarted(true);

      // Connect WebSocket via pool
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/ws/${session.session_id}`;
        await wsPool.connect('chat', wsUrl)
      } catch (err) {
        console.error('Failed to connect pooled WebSocket for chat:', err)
      }

      // Load existing messages
      await loadChatMessages(session.session_id);

      onChatStart?.(session.session_id);

    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Unable to start chat. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Register pooled handlers when chatSession changes
  useEffect(() => {
    if (!chatSession) return

    const handleMessage = (ev: any) => {
      try {
        const data = JSON.parse(ev.data)
        handleWebSocketMessage(data)
      } catch (err) {
        console.error('Failed to parse chat WS message:', err)
      }
    }

    const handleClose = (ev: any) => {
      console.log('Chat WebSocket disconnected (pooled)')
      // Attempt reconnect after 3s unless chat ended
      if (chatSession) {
        window.setTimeout(() => {
          wsPool.connect('chat', `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/chat/ws/${chatSession.session_id}`)
        }, 3000)
      }
    }

    const handleOpen = () => console.log('Chat WebSocket (pooled) connected')

    try {
      wsPool.on('message', handleMessage)
      wsPool.on('close', handleClose)
      wsPool.on('open', handleOpen)
    } catch (_) { }

    return () => {
      try {
        wsPool.off('message', handleMessage)
        wsPool.off('close', handleClose)
        wsPool.off('open', handleOpen)
      } catch (_) { }
    }
  }, [chatSession, wsPool]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'chat_message': {
        const newMessage: ChatMessage = {
          id: data.message.id,
          content: data.message.content,
          type: data.message.message_type,
          timestamp: new Date(data.message.created_at),
          sender_name: data.message.sender_name,
          bot_confidence: data.message.bot_confidence
        };
        setMessages(prev => [...prev, newMessage]);

        // Show bot typing for a moment before message
        if (newMessage.type === 'bot') {
          setBotTyping(false);
        }
        break;
      }

      case 'typing_indicator':
        if (data.user_type === 'bot') {
          setBotTyping(data.is_typing);
        }
        break;

      case 'connection_established':
        console.log('Chat connection established');
        break;

      default:
        console.log('Unknown WebSocket message:', data);
    }
  };

  // Load chat messages
  const loadChatMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const messageData = await response.json();
        const formattedMessages: ChatMessage[] = messageData.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.message_type,
          timestamp: new Date(msg.created_at),
          sender_name: msg.sender_name,
          bot_confidence: msg.bot_confidence,
          is_read: msg.is_read
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!currentMessage.trim() || !chatSession) return;

    const messageText = currentMessage.trim();
    setCurrentMessage('');

    // Add user message immediately to UI
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageText,
      type: 'user',
      timestamp: new Date(),
      sender_name: userData?.username || guestName || 'Guest'
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Try pooled WebSocket first
      if (wsPool.isConnected) {
        wsPool.send({
          type: 'chat_message',
          content: messageText,
          sender_name: userMessage.sender_name
        })
      } else {
        // Fallback to REST API
        await fetch(`/api/chat/sessions/${chatSession.session_id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            content: messageText,
            message_type: 'user',
            sender_name: userMessage.sender_name
          })
        });
      }

      // Show bot typing indicator
      setBotTyping(true);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);

    // Send typing indicator via WebSocket
    if (wsPool.isConnected) {
      wsPool.send({ type: 'typing', is_typing: true })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      if (wsPool.isConnected) {
        wsPool.send({ type: 'typing', is_typing: false })
      }
    }, 3000) as unknown as number;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Close chat
  const closeChat = () => {
    setIsOpen(false);

    // Clean up WebSocket
    try { wsPool.close() } catch (_) { }
    currentConnRef.current = null

    if (chatSession) {
      onChatEnd?.(chatSession.session_id);
    }
  };

  // Render message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isBot = message.type === 'bot';
    const isSystem = message.type === 'system';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <Avatar className={`w-8 h-8 ${isUser ? 'order-2' : 'order-1'}`}>
          <AvatarFallback className={`text-xs ${isUser ? 'bg-red-600 text-white' :
              isBot ? 'bg-blue-600 text-white' :
                'bg-zinc-600 text-white'
            }`}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : isBot ? (
              <Bot className="w-4 h-4" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Message content */}
        <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Sender name */}
          <div className="text-xs text-zinc-400 mb-1">
            {isBot ? 'SGPT Assistant' :
              isSystem ? 'System' :
                message.sender_name || 'Guest'}
          </div>

          {/* Message bubble */}
          <div className={`
            px-3 py-2 rounded-lg text-sm max-w-full break-words
            ${isUser ?
              'bg-red-600 text-white rounded-br-sm' :
              isSystem ?
                'bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-600' :
                'bg-zinc-800 text-white rounded-bl-sm'
            }
          `}>
            {message.content}

            {/* Bot confidence indicator */}
            {isBot && message.bot_confidence && (
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {message.bot_confidence}% confidence
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-zinc-500 mt-1">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  // Don't render if chat not available for user's plan
  if (!canUseChat) {
    return null;
  }

  // Chat button (when closed)
  if (!isOpen) {
    return (
      <div className={`fixed z-50 ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
        }`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-colors duration-200"
            >
              <MessageCircle className="w-6 h-6" />

              {/* Online indicator */}
              {widgetStatus?.admin_online && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              )}

              {/* New message indicator */}
              {messages.some(m => !m.is_read && m.type !== 'user') && (
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Need help? Start a chat</p>
            {widgetStatus?.estimated_response_time && (
              <p className="text-xs text-zinc-400">
                Response time: {widgetStatus.estimated_response_time}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
      }`}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            height: isMinimized ? 'auto' : '600px'
          }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
          style={{ width: '380px' }}
        >
          {/* Header */}
          <CardHeader className="bg-zinc-800 border-b border-zinc-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-8 h-8 bg-red-600">
                    <AvatarFallback className="bg-red-600 text-white text-sm">
                      <MessageCircle className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  {widgetStatus?.admin_online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-zinc-800" />
                  )}
                </div>

                <div>
                  <h3 className="text-white font-semibold text-sm">
                    SGPT Support
                  </h3>
                  <p className="text-zinc-400 text-xs">
                    {widgetStatus?.admin_online ? 'Online now' : 'We\'ll reply soon'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-zinc-400 hover:text-white h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="text-zinc-400 hover:text-white h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2 mt-2">
              {widgetStatus?.queue_position && (
                <Badge variant="secondary" className="text-xs" aria-label={`Queue position ${widgetStatus.queue_position}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  Position {widgetStatus.queue_position} in queue
                </Badge>
              )}

              {widgetStatus?.estimated_response_time && (
                <Badge variant="outline" className="text-xs" aria-label={`Estimated response time ${widgetStatus.estimated_response_time}`}>
                  Response: {widgetStatus.estimated_response_time}
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Chat content */}
          {!isMinimized && (
            <CardContent className="p-0 h-96 flex flex-col">
              {!chatStarted ? (
                /* Start chat form */
                <div className="p-6 space-y-4">
                  <div className="text-center">
                    <h4 className="text-white font-medium mb-2">
                      Welcome to SGPT Support!
                    </h4>
                    <p className="text-zinc-400 text-sm mb-4">
                      {widgetStatus?.greeting_message || 'How can we help you today?'}
                    </p>
                  </div>

                  {!userData && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="bg-zinc-800 border-zinc-600 text-white"
                      />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="bg-zinc-800 border-zinc-600 text-white"
                      />
                    </div>
                  )}

                  <Button
                    onClick={startChatSession}
                    disabled={isConnecting || (!userData && (!guestName || !guestEmail))}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting chat...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start chat
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Chat interface */
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-1">
                      {messages.map(renderMessage)}

                      {/* Bot typing indicator */}
                      {botTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-zinc-400 text-sm"
                        >
                          <Avatar className="w-6 h-6 bg-blue-600">
                            <AvatarFallback className="bg-blue-600">
                              <Bot className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  <div className="border-t border-zinc-700 p-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={messageInputRef}
                          value={currentMessage}
                          onChange={(e) => {
                            setCurrentMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Type your message..."
                          className="bg-zinc-800 border-zinc-600 text-white text-sm min-h-[40px] max-h-[120px] resize-none"
                          rows={1}
                        />
                      </div>

                      <Button
                        onClick={sendMessage}
                        disabled={!currentMessage.trim()}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white px-3"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-xs text-zinc-500 mt-2 text-center">
                      Powered by SGPT AI Assistant
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LiveChatWidget;