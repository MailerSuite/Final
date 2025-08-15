import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  RefreshCw,
  Send,
  Search,
  Filter,
  UserCheck,
  Activity,
  TrendingUp,
  MessageCircle,
  Phone,
  Mail
} from 'lucide-react';

interface ChatConversation {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'active' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  last_message: string;
  last_message_at: string;
  agent_id?: string;
  agent_name?: string;
  created_at: string;
  messages_count: number;
  unread_count: number;
}

interface ChatStats {
  total_conversations: number;
  active_conversations: number;
  pending_conversations: number;
  resolved_today: number;
  average_response_time_minutes: number;
  customer_satisfaction: number;
  agent_stats: Array<{
    agent_id: string;
    agent_name: string;
    active_chats: number;
    total_resolved: number;
    avg_rating: number;
    status: 'online' | 'offline' | 'busy';
  }>;
}

const AdminChatPage = () => {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [chatStats, setChatStats] = useState<ChatStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '50');
      
      const response = await axios.get(`/api/v1/admin/chat/conversations?${params}`);
      setConversations(response.data.conversations || []);
      toast.success('💬 Conversations loaded - LIVE DATA!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to load conversations';
      toast.error(errorMessage);
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatStats = async () => {
    try {
      const response = await axios.get('/api/v1/admin/chat/stats');
      setChatStats(response.data);
      toast.success('📊 Chat stats loaded - LIVE DATA!');
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to load chat stats';
      toast.error(errorMessage);
      console.error('Error loading chat stats:', error);
    }
  };

  const handleAssignConversation = async (conversationId: string, agentId: string) => {
    try {
      await axios.post(`/api/v1/admin/chat/conversations/${conversationId}/assign`, {
        agent_id: agentId
      });
      await loadConversations();
      toast.success('Conversation assigned successfully!');
      setAssignDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error.response?.data?.detail || 'Failed to assign conversation';
      toast.error(errorMessage);
      console.error('Error assigning conversation:', error);
    }
  };

  useEffect(() => {
    loadConversations();
    loadChatStats();
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'resolved': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border/30';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Chat Management
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage customer support conversations and agents - <span className="text-green-400 font-semibold">LIVE DATA!</span>
          </p>
        </motion.div>

        {/* Stats Overview */}
        {chatStats && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            variants={itemVariants}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Conversations</p>
                    <p className="text-xl font-bold text-white">{chatStats.total_conversations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Chats</p>
                    <p className="text-xl font-bold text-white">{chatStats.active_conversations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-xl font-bold text-white">{chatStats.average_response_time_minutes}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Star className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                    <p className="text-xl font-bold text-white">{chatStats.customer_satisfaction}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="conversations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm">
              <TabsTrigger value="conversations" className="data-[state=active]:bg-blue-500/20">
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="agents" className="data-[state=active]:bg-purple-500/20">
                <Users className="w-4 h-4 mr-2" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-green-500/20">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white w-64"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={loadConversations}
                  disabled={loading}
                  variant="outline"
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Conversations List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Loading conversations...</span>
                    </div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Conversations</h3>
                      <p className="text-muted-foreground">No conversations match your current filters.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredConversations.map((conversation) => (
                    <Card key={conversation.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <CardTitle className="text-white text-lg">{conversation.subject}</CardTitle>
                              <Badge className={`px-2 py-1 text-xs ${getStatusColor(conversation.status)}`}>
                                {conversation.status}
                              </Badge>
                              <Badge className={`px-2 py-1 text-xs ${getPriorityColor(conversation.priority)}`}>
                                {conversation.priority} priority
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{conversation.user_name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{conversation.user_email}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTimeAgo(conversation.last_message_at)}</span>
                              </span>
                            </div>
                            
                            {conversation.agent_name && (
                              <div className="text-sm text-blue-300">
                                Assigned to: {conversation.agent_name}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {conversation.messages_count} messages
                            </Badge>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                {conversation.unread_count} unread
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedConversation(conversation.id);
                                setAssignDialogOpen(true);
                              }}
                              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground text-sm">{conversation.last_message}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Support Agents</h2>
              
              {chatStats?.agent_stats && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chatStats.agent_stats.map((agent) => (
                    <Card key={agent.agent_id} className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {agent.agent_name.charAt(0)}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getAgentStatusColor(agent.status)} rounded-full border-2 border-gray-900`} />
                            </div>
                            <div>
                              <CardTitle className="text-white text-lg">{agent.agent_name}</CardTitle>
                              <p className="text-sm text-muted-foreground capitalize">{agent.status}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-semibold">{agent.avg_rating}</span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Active Chats:</span>
                            <p className="text-white font-semibold">{agent.active_chats}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Resolved:</span>
                            <p className="text-white font-semibold">{agent.total_resolved}</p>
                          </div>
                        </div>
                        
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Assign Chat
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Chat Analytics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Response Time Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">Response time analytics will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Volume Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">Chat volume statistics will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Assignment Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="bg-background/95 border-border">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <span>Assign Conversation</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">Select an agent to assign this conversation to:</p>
              
              {chatStats?.agent_stats.map((agent) => (
                <Button
                  key={agent.agent_id}
                  onClick={() => selectedConversation && handleAssignConversation(selectedConversation, agent.agent_id)}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white justify-start"
                  disabled={agent.status === 'offline'}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {agent.agent_name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getAgentStatusColor(agent.status)} rounded-full border border-gray-900`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{agent.agent_name}</div>
                      <div className="text-xs text-muted-foreground">{agent.active_chats} active chats</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default AdminChatPage;