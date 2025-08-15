/**
 * Admin Chat Dashboard Component
 * Comprehensive dashboard for managing live chat sessions and support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bot,
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  MoreVertical,
  Send,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  Zap,
  Settings,
  Download,
  Eye,
  Archive,
  Star,
  Tag
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { createWebSocket } from '@/utils/websocket';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

// Types
interface ChatSession {
  id: number;
  session_id: string;
  user_id?: number;
  guest_email?: string;
  guest_name?: string;
  subject?: string;
  status: 'pending' | 'active' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_admin_id?: number;
  page_url?: string;
  user_plan?: string;
  started_at: string;
  last_activity: string;
  resolved_at?: string;
  message_count: number;
  unread_messages: number;
  is_online: boolean;
}

interface ChatMessage {
  id: number;
  content: string;
  message_type: 'user' | 'bot' | 'admin' | 'system';
  sender_name?: string;
  sender_id?: number;
  is_read: boolean;
  is_internal: boolean;
  bot_confidence?: number;
  created_at: string;
}

interface ChatAnalytics {
  period_days: number;
  total_chats: number;
  resolved_chats: number;
  resolution_rate: number;
  avg_resolution_time_seconds: number;
  plan_breakdown: Record<string, number>;
  bot_analytics: {
    total_responses: number;
    success_rate: number;
    escalation_rate: number;
    most_common_intents: Record<string, number>;
  };
  online_admins: number;
  active_sessions: number;
}

const AdminChatDashboard: React.FC = () => {
  // State management
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedToMe, setAssignedToMe] = useState(false);

  // Message input
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChats, setTotalChats] = useState(0);
  const pageSize = 20;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Hooks
  const { userData } = useAuthStore();

  // Load data on mount
  useEffect(() => {
    loadChatSessions();
    loadAnalytics();
    connectWebSocket();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadChatSessions();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Load chat sessions with filters
  useEffect(() => {
    loadChatSessions();
  }, [currentPage, statusFilter, priorityFilter, assignedToMe, searchQuery]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadChatMessages(selectedChat.session_id);
    }
  }, [selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Connect WebSocket for real-time updates
  const connectWebSocket = () => {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/admin/ws?token=${userData?.token}`;

      websocketRef.current = createWebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('Admin WebSocket connected');
      };

      websocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      websocketRef.current.onclose = () => {
        console.log('Admin WebSocket disconnected');
        // Attempt to reconnect
        setTimeout(connectWebSocket, 5000);
      };

    } catch (error) {
      console.error('Failed to connect admin WebSocket:', error);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: unknown) => {
    switch (data.type) {
      case 'new_chat':
        toast.info('New chat session started');
        loadChatSessions();
        break;

      case 'chat_message':
        if (selectedChat && data.session_id === selectedChat.session_id) {
          loadChatMessages(selectedChat.session_id);
        }
        loadChatSessions(); // Update unread counts
        break;

      case 'chat_assigned':
        toast.success('Chat assigned successfully');
        loadChatSessions();
        break;

      case 'chat_escalated':
        toast.warning('Chat escalated - needs attention');
        loadChatSessions();
        break;

      default:
        console.log('Unknown WebSocket message:', data);
    }
  };

  // Load chat sessions
  const loadChatSessions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(assignedToMe && { assigned_to_me: 'true' }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/chat/admin/chats?${params}`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.chats);
        setTotalChats(data.total);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  // Load chat messages
  const loadChatMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages?include_internal=true`, {
        headers: {
          'Authorization': `Bearer ${userData?.token}`
        }
      });

      if (response.ok) {
        const messages = await response.json();
        setChatMessages(messages);
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/chat/admin/analytics?days=30', {
        headers: {
          'Authorization': `Bearer ${userData?.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    try {
      const response = await fetch(`/api/chat/sessions/${selectedChat.session_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify({
          content: newMessage,
          message_type: 'admin',
          sender_name: userData?.username,
          is_internal: isInternal
        })
      });

      if (response.ok) {
        setNewMessage('');
        setIsInternal(false);
        loadChatMessages(selectedChat.session_id);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Assign chat to admin
  const assignChat = async (sessionId: string, adminId?: number) => {
    try {
      const url = adminId
        ? `/api/chat/admin/chats/${sessionId}/assign`
        : `/api/chat/admin/chats/${sessionId}/assign`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        ...(adminId && { body: JSON.stringify({ admin_id: adminId }) })
      });

      if (response.ok) {
        toast.success('Chat assigned successfully');
        loadChatSessions();
      } else {
        throw new Error('Failed to assign chat');
      }
    } catch (error) {
      console.error('Failed to assign chat:', error);
      toast.error('Failed to assign chat');
    }
  };

  // Update chat status
  const updateChatStatus = async (sessionId: string, status: string) => {
    try {
      const response = await fetch(`/api/chat/admin/chats/${sessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData?.token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Chat marked as ${status}`);
        loadChatSessions();
        if (selectedChat && selectedChat.session_id === sessionId) {
          loadChatMessages(sessionId);
        }
      } else {
        throw new Error('Failed to update chat status');
      }
    } catch (error) {
      console.error('Failed to update chat status:', error);
      toast.error('Failed to update chat status');
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'resolved': return 'bg-blue-500';
      case 'closed': return 'bg-zinc-500';
      case 'escalated': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-zinc-500';
    }
  };

  // Filter chats based on search
  const filteredChats = chatSessions.filter(chat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.guest_name?.toLowerCase().includes(query) ||
      chat.guest_email?.toLowerCase().includes(query) ||
      chat.subject?.toLowerCase().includes(query) ||
      chat.session_id.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" />
          <p className="text-zinc-400">Loading chat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chat Dashboard</h1>
          <p className="text-zinc-400">Manage customer support and live chat sessions</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadChatSessions}
            className="bg-zinc-800 border-zinc-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button className="bg-red-600 hover:bg-red-700">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Total Chats</p>
                  <p className="text-white text-xl font-bold">{analytics.total_chats}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Resolution Rate</p>
                  <p className="text-white text-xl font-bold">{(analytics?.resolution_rate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Bot Success Rate</p>
                  <p className="text-white text-xl font-bold">{(analytics?.bot_analytics?.success_rate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <Activity className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Online Admins</p>
                  <p className="text-white text-xl font-bold">{analytics?.online_admins ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Chat Sessions</CardTitle>
                <Badge variant="secondary">{totalChats}</Badge>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <Input
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-600"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant={assignedToMe ? "default" : "outline"}
                  onClick={() => setAssignedToMe(!assignedToMe)}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {assignedToMe ? "Assigned to Me" : "Show Assigned to Me"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-1 p-3">
                  {filteredChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      whileHover={{ scale: 1.02 }}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-colors border
                        ${selectedChat?.id === chat.id
                          ? 'bg-red-600/20 border-red-600/50'
                          : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
                        }
                      `}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(chat.status)}`} />
                            <span className="text-white text-sm font-medium truncate">
                              {chat.guest_name || 'Guest User'}
                            </span>
                            {chat.unread_messages > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unread_messages}
                              </Badge>
                            )}
                          </div>

                          <p className="text-zinc-400 text-xs truncate mb-1">
                            {chat.subject || chat.guest_email || 'No subject'}
                          </p>

                          <div className="flex items-center gap-2 text-xs">
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(chat.priority)} border-current`}
                            >
                              {chat.priority}
                            </Badge>

                            {chat.user_plan && (
                              <Badge variant="secondary" className="text-xs">
                                {chat.user_plan}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-zinc-500 text-xs">
                            {new Date(chat.last_activity).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>

                          <div className="flex items-center gap-1 mt-1">
                            {chat.is_online && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => assignChat(chat.session_id)}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Assign to Me
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateChatStatus(chat.session_id, 'resolved')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateChatStatus(chat.session_id, 'escalated')}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Escalate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filteredChats.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                      <p className="text-zinc-400">No chat sessions found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {selectedChat.guest_name || 'Guest User'}
                      {selectedChat.is_online && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </CardTitle>
                    <p className="text-zinc-400 text-sm">
                      {selectedChat.guest_email} • {selectedChat.user_plan} plan
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedChat.status)}>
                      {selectedChat.status}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                          <MoreVertical className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => assignChat(selectedChat.session_id)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign to Me
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateChatStatus(selectedChat.session_id, 'resolved')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateChatStatus(selectedChat.session_id, 'closed')}>
                          <Archive className="w-4 h-4 mr-2" />
                          Close Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateChatStatus(selectedChat.session_id, 'escalated')}>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Escalate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.message_type === 'admin' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`text-xs ${message.message_type === 'user' ? 'bg-blue-600' :
                              message.message_type === 'bot' ? 'bg-purple-600' :
                                message.message_type === 'admin' ? 'bg-red-600' :
                                  'bg-zinc-600'
                            }`}>
                            {message.message_type === 'user' ? 'U' :
                              message.message_type === 'bot' ? 'B' :
                                message.message_type === 'admin' ? 'A' : 'S'}
                          </AvatarFallback>
                        </Avatar>

                        <div className={`max-w-[70%] ${message.message_type === 'admin' ? 'text-right' : 'text-left'
                          }`}>
                          <div className="text-xs text-zinc-400 mb-1">
                            {message.sender_name || message.message_type} • {
                              new Date(message.created_at).toLocaleTimeString()
                            }
                            {message.is_internal && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Internal
                              </Badge>
                            )}
                          </div>

                          <div className={`
                            px-3 py-2 rounded-lg text-sm
                            ${message.message_type === 'admin' ?
                              'bg-red-600 text-white' :
                              message.message_type === 'system' ?
                                'bg-zinc-700 text-zinc-300' :
                                'bg-zinc-800 text-white'
                            }
                            ${message.is_internal ? 'border border-yellow-500/50' : ''}
                          `}>
                            {message.content}

                            {message.bot_confidence && (
                              <div className="text-xs text-zinc-400 mt-1">
                                Confidence: {message.bot_confidence}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-zinc-700 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isInternal ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsInternal(!isInternal)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Internal Note
                      </Button>

                      {isInternal && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                          Only visible to admins
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isInternal ? "Add internal note..." : "Type your message..."}
                        className="bg-zinc-800 border-zinc-600 text-white resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />

                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {sending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900 border-zinc-700">
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">
                    Select a chat to start
                  </h3>
                  <p className="text-zinc-400">
                    Choose a chat session from the left to view messages and respond
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatDashboard; 