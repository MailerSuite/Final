/**
 * useLiveChat Hook
 * Custom hook for managing live chat functionality with plan-based access
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { usePlan } from '@/hooks/usePlan';
import { toast } from 'sonner';
import { useWebSocketPool } from '@/hooks/useWebSocketPool';

// Types
interface ChatSession {
  id: string;
  session_id: string;
  status: 'pending' | 'active' | 'resolved' | 'closed';
  started_at: Date;
  assigned_admin?: string;
  admin_online?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot' | 'admin' | 'system';
  timestamp: Date;
  sender_name?: string;
  bot_confidence?: number;
  is_read?: boolean;
}

interface ChatWidgetStatus {
  is_available: boolean;
  admin_online: boolean;
  estimated_response_time?: string;
  queue_position?: number;
  bot_enabled: boolean;
  greeting_message: string;
}

interface ChatLimits {
  plan_code: string;
  max_monthly_chats?: number;
  current_month_chats: number;
  feature_access: {
    can_initiate_chat: boolean;
    can_upload_files: boolean;
    priority_support: boolean;
    dedicated_agent: boolean;
    chat_history_retention_days: number;
    max_concurrent_chats: number;
    estimated_response_time: string;
  };
  upgrade_required_for: string[];
}

interface UseLiveChatReturn {
  // State
  isAvailable: boolean;
  isConnected: boolean;
  isLoading: boolean;
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  widgetStatus: ChatWidgetStatus | null;
  chatLimits: ChatLimits | null;
  unreadCount: number;

  // Actions
  startChat: (guestName?: string, guestEmail?: string, initialMessage?: string) => Promise<ChatSession | null>;
  sendMessage: (content: string) => Promise<boolean>;
  endChat: () => void;
  markAsRead: () => void;

  // Connection management
  connect: () => void;
  disconnect: () => void;

  // Utility
  canUseChat: boolean;
  needsUpgrade: boolean;
  upgradeMessage: string;
}

export const useLiveChat = (): UseLiveChatReturn => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [widgetStatus, setWidgetStatus] = useState<ChatWidgetStatus | null>(null);
  const [chatLimits, setChatLimits] = useState<ChatLimits | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  // Use pooled WebSocket hook
  const wsPool = useWebSocketPool();
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Hooks
  const { userData, token } = useAuthStore();
  const { hasFeature, isAtLeastPlan } = usePlan();

  // Plan-based access control
  const canUseChat = hasFeature('basic_support') || hasFeature('premium_support');
  const needsUpgrade = !canUseChat;
  const upgradeMessage = needsUpgrade
    ? 'Chat support is not available in your current plan. Please upgrade to access live chat.'
    : '';

  // Initialize chat system
  useEffect(() => {
    if (canUseChat) {
      loadWidgetStatus();
      loadChatLimits();
    }
    setIsLoading(false);
  }, [canUseChat, userData]);

  // Load widget status
  const loadWidgetStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/widget/status', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const status: ChatWidgetStatus = await response.json();
        setWidgetStatus(status);
      }
    } catch (error) {
      console.error('Failed to load widget status:', error);
    }
  }, [token]);

  // Load chat limits
  const loadChatLimits = useCallback(async () => {
    if (!userData && !token) return;

    try {
      const response = await fetch('/api/chat/my/limits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const limits: ChatLimits = await response.json();
        setChatLimits(limits);
      }
    } catch (error) {
      console.error('Failed to load chat limits:', error);
    }
  }, [token]);

  // Check if user has reached chat limits
  const hasReachedLimits = useCallback((): boolean => {
    if (!chatLimits) return false;

    const maxChats = chatLimits.max_monthly_chats;
    if (!maxChats) return false; // Unlimited

    return chatLimits.current_month_chats >= maxChats;
  }, [chatLimits]);

  // Start chat session
  const startChat = useCallback(async (
    guestName?: string,
    guestEmail?: string,
    initialMessage?: string
  ): Promise<ChatSession | null> => {
    if (!canUseChat) {
      toast.error(upgradeMessage);
      return null;
    }

    if (hasReachedLimits()) {
      toast.error('You have reached your monthly chat limit. Please upgrade your plan to continue.');
      return null;
    }

    setIsLoading(true);

    try {
      const sessionData = {
        guest_name: userData?.username || guestName,
        guest_email: userData?.email || guestEmail,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        initial_message: initialMessage
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
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start chat session');
      }

      const session = await response.json();
      const chatSession: ChatSession = {
        id: session.id,
        session_id: session.session_id,
        status: session.status,
        started_at: new Date(session.started_at),
        assigned_admin: session.assigned_admin_id,
        admin_online: session.is_online
      };

      setCurrentSession(chatSession);

      // Connect WebSocket
      connectWebSocket(chatSession.session_id);

      // Load existing messages
      await loadChatMessages(chatSession.session_id);

      // Update limits
      await loadChatLimits();

      return chatSession;

    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to start chat. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [canUseChat, upgradeMessage, hasReachedLimits, userData, loadChatLimits]);

  // Handle WebSocket messages (moved earlier so connectWebSocket can reference it)
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'chat_message': {
        const newMessage: ChatMessage = {
          id: data.message.id,
          content: data.message.content,
          type: data.message.message_type,
          timestamp: new Date(data.message.created_at),
          sender_name: data.message.sender_name,
          bot_confidence: data.message.bot_confidence,
          is_read: data.message.is_read
        };

        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // Update unread count for non-user messages
        if (newMessage.type !== 'user' && !newMessage.is_read) {
          setUnreadCount(prev => prev + 1);
        }
        break;
      }

      case 'connection_established':
        console.log('Chat connection established');
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'error':
        console.error('Chat error:', data.message);
        toast.error(data.message);
        break;

      default:
        console.log('Unknown WebSocket message:', data);
    }
  }, []);

  // Load chat messages
  const loadChatMessages = useCallback(async (sessionId: string) => {
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

        // Count unread messages
        const unread = formattedMessages.filter(m =>
          !m.is_read && m.type !== 'user'
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [token]);

  // Connect via pooled WebSocket
  const connectWebSocket = useCallback(async (sessionId: string) => {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/ws/${sessionId}${token ? `?token=${token}` : ''
        }`;

      await wsPool.connect('chat', wsUrl);

      // register message handler
      wsPool.on('message', (ev: any) => {
        try {
          const data = JSON.parse(ev.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      });

      wsPool.on('open', () => setIsConnected(true));
      wsPool.on('close', (ev: any) => {
        setIsConnected(false);
        // Attempt to reconnect if not a normal closure
        const code = (ev && (ev.code as number)) || 1000;
        if (code !== 1000 && currentSession) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket(currentSession.session_id);
          }, 3000);
        }
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [token, currentSession, wsPool, handleWebSocketMessage]);

  // Send message (use pooled WS if available, else REST fallback)
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!currentSession || !content.trim()) return false

    const messageText = content.trim()

    try {
      // Try pooled WebSocket first
      if (wsPool && wsPool.isConnected) {
        wsPool.send({
          type: 'chat_message',
          content: messageText,
          sender_name: userData?.username || 'Guest'
        })
        return true
      }

      // Fallback to REST API
      const response = await fetch(`/api/chat/sessions/${currentSession.session_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          content: messageText,
          message_type: 'user',
          sender_name: userData?.username || 'Guest'
        })
      })

      if (!response.ok) throw new Error('Failed to send message')
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
      return false
    }
  }, [currentSession, userData, wsPool, token])

  // Mark messages as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
  }, []);

  // End chat session
  const endChat = useCallback(() => {
    try { wsPool.close() } catch (_) { }

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setCurrentSession(null)
    setMessages([])
    setUnreadCount(0)
    setIsConnected(false)
  }, [wsPool]);

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (currentSession) connectWebSocket(currentSession.session_id)
  }, [currentSession, connectWebSocket])

  const disconnect = useCallback(() => {
    try { wsPool.close() } catch (_) { }
  }, [wsPool])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endChat()
    }
  }, [endChat])

  // Auto-refresh widget status
  useEffect(() => {
    if (!canUseChat) return;

    const interval = setInterval(loadWidgetStatus, 60000); // Every minute
    return () => clearInterval(interval);
  }, [canUseChat, loadWidgetStatus]);

  return {
    // State
    isAvailable: canUseChat && (widgetStatus?.is_available ?? false),
    isConnected,
    isLoading,
    currentSession,
    messages,
    widgetStatus,
    chatLimits,
    unreadCount,

    // Actions
    startChat,
    sendMessage,
    endChat,
    markAsRead,

    // Connection management
    connect,
    disconnect,

    // Utility
    canUseChat,
    needsUpgrade,
    upgradeMessage
  };
};