import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { 
  SparklesIcon, 
  PaperAirplaneIcon, 
  LightBulbIcon, 
  BeakerIcon, 
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  UserCircleIcon,
  ClipboardDocumentListIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  DocumentArrowUpIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  BoltIcon,
  BookOpenIcon,
  AdjustmentsHorizontalIcon,
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  InformationCircleIcon,
  FolderIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Bot, Brain, Zap, MessageSquare, Target, Users, FileText, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ProBadge from '@/components/ui/ProBadge';

type Message = { 
  id: string; 
  role: 'assistant' | 'user' | 'system'; 
  content: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'error';
  rating?: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }[];
  persona?: 'marketing' | 'email' | 'analytics' | 'general';
  conversationId?: string;
  tokens?: number;
};

type QuickAction = {
  id: string;
  icon: React.ElementType;
  label: string;
  prompt: string;
  category: 'content' | 'analysis' | 'optimization' | 'workflow';
};

type Persona = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  expertise: string[];
  systemPrompt: string;
};

type ConversationTemplate = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  messages: Pick<Message, 'role' | 'content'>[];
};

type SearchResult = {
  messageId: string;
  content: string;
  timestamp: Date;
  relevance: number;
};

type UsageStats = {
  totalMessages: number;
  totalTokens: number;
  conversationsToday: number;
  avgResponseTime: number;
  topCategories: string[];
};

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Core state
  const [model, setModel] = useState('gpt-4o-mini');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamMode, setStreamMode] = useState(true);
  const [temperature, setTemperature] = useState([0.7]);
  const [activeTab, setActiveTab] = useState('chat');
  
  // Enhanced features state
  const [currentPersona, setCurrentPersona] = useState('general');
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [conversationId, setConversationId] = useState(crypto.randomUUID());
  const [conversations, setConversations] = useState<string[]>([conversationId]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalMessages: 0,
    totalTokens: 0,
    conversationsToday: 1,
    avgResponseTime: 1.2,
    topCategories: ['content', 'analysis']
  });
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'm1', 
      role: 'assistant', 
      content: '🚀 Welcome to your Advanced AI Assistant! I\'m here to revolutionize your email marketing workflow.\n\n**Core Capabilities:**\n• 🎯 **Content Creation** - Advanced email copywriting with A/B testing suggestions\n• 📊 **Performance Analysis** - Deep analytics and predictive insights\n• ⚡ **Campaign Optimization** - Real-time optimization recommendations\n• 🔄 **Workflow Automation** - Intelligent sequence building and triggers\n• 📁 **File Analysis** - Upload and analyze campaign data, images, and documents\n• 🎭 **Multiple Personas** - Switch between specialized AI experts\n• 🗣️ **Voice Interaction** - Speak your requests naturally\n• 🤝 **Team Collaboration** - Share conversations and collaborate with team members\n\n**New Features:**\n• Smart conversation templates\n• Advanced search through chat history\n• Real-time usage analytics\n• Custom assistant training\n• Export and sharing capabilities\n\nChoose a persona below or ask me anything to get started!',
      timestamp: new Date(),
      conversationId
    }
  ]);
  
  // Personas configuration
  const personas: Persona[] = useMemo(() => [
    {
      id: 'general',
      name: 'General Assistant',
      description: 'Versatile AI helper for all your needs',
      icon: Bot,
      color: 'cyan',
      expertise: ['General Support', 'Quick Tasks', 'Information'],
      systemPrompt: 'You are a helpful general assistant specialized in email marketing platforms.'
    },
    {
      id: 'marketing',
      name: 'Marketing Expert',
      description: 'Strategic marketing insights and campaign planning',
      icon: Target,
      color: 'green',
      expertise: ['Strategy', 'Campaigns', 'Market Analysis', 'ROI Optimization'],
      systemPrompt: 'You are a senior marketing strategist with 15+ years of experience in email marketing, conversion optimization, and customer journey design.'
    },
    {
      id: 'email',
      name: 'Email Specialist',
      description: 'Email copywriting and deliverability expert',
      icon: MessageSquare,
      color: 'blue',
      expertise: ['Copywriting', 'Deliverability', 'Design', 'Personalization'],
      systemPrompt: 'You are an expert email marketing specialist focused on creating high-converting email campaigns, improving deliverability, and crafting compelling copy.'
    },
    {
      id: 'analytics',
      name: 'Analytics Guru',
      description: 'Data analysis and performance optimization',
      icon: ChartBarIcon,
      color: 'purple',
      expertise: ['Data Analysis', 'KPI Tracking', 'A/B Testing', 'Reporting'],
      systemPrompt: 'You are a data analytics expert specializing in email marketing metrics, statistical analysis, and performance optimization.'
    }
  ], []);

  // Conversation templates
  const conversationTemplates: ConversationTemplate[] = useMemo(() => [
    {
      id: 'welcome-series',
      name: 'Welcome Email Series',
      description: 'Create a comprehensive onboarding sequence',
      icon: UserCircleIcon,
      category: 'Workflows',
      messages: [
        { role: 'user', content: 'I need to create a welcome email series for new subscribers to my SaaS platform.' },
        { role: 'assistant', content: 'I\'ll help you create a comprehensive welcome series. Let me ask a few questions to personalize this for your SaaS platform...' }
      ]
    },
    {
      id: 'performance-audit',
      name: 'Campaign Performance Audit',
      description: 'Analyze and optimize existing campaigns',
      icon: ChartBarIcon,
      category: 'Analysis',
      messages: [
        { role: 'user', content: 'Can you help me analyze my recent email campaign performance and identify areas for improvement?' },
        { role: 'assistant', content: 'Absolutely! I\'ll conduct a thorough performance audit. Please share your campaign metrics or upload your analytics data...' }
      ]
    },
    {
      id: 'ab-test-setup',
      name: 'A/B Testing Strategy',
      description: 'Design effective A/B tests for campaigns',
      icon: BeakerIcon,
      category: 'Optimization',
      messages: [
        { role: 'user', content: 'I want to set up A/B tests for my email campaigns. What should I test first?' },
        { role: 'assistant', content: 'Great question! Let\'s design a comprehensive A/B testing strategy. First, tell me about your current campaign performance...' }
      ]
    }
  ], []);

  const quickActions: QuickAction[] = useMemo(() => [
    { 
      id: 'q1',
      icon: DocumentTextIcon,
      label: 'Welcome Email',
      prompt: 'Draft a professional welcome email for new signups with personalization tokens',
      category: 'content'
    },
    { 
      id: 'q2',
      icon: SparklesIcon,
      label: 'Subject Lines',
      prompt: 'Generate 10 high-converting subject lines for a Black Friday sale campaign',
      category: 'content'
    },
    { 
      id: 'q3',
      icon: ChartBarIcon,
      label: 'Performance Report',
      prompt: 'Analyze last week\'s campaign performance and identify key insights',
      category: 'analysis'
    },
    { 
      id: 'q4',
      icon: ClipboardDocumentListIcon,
      label: 'Re-engagement Series',
      prompt: 'Create a 3-email re-engagement sequence for inactive subscribers',
      category: 'workflow'
    },
    {
      id: 'q5',
      icon: CogIcon,
      label: 'A/B Test Ideas',
      prompt: 'Suggest 5 A/B test ideas to improve email open rates',
      category: 'optimization'
    },
    {
      id: 'q6',
      icon: ChatBubbleLeftRightIcon,
      label: 'Follow-up Template',
      prompt: 'Write a follow-up email template for cart abandonment',
      category: 'content'
    }
  ], []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate contextual suggestions based on conversation
  useEffect(() => {
    if (messages.length > 1) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        // Simulate AI-generated suggestions based on context
        const suggestions = [
          'Can you make this more engaging?',
          'What metrics should I track?',
          'How can I improve deliverability?',
          'Create a follow-up sequence',
          'Analyze competitor strategies'
        ];
        setSuggestedPrompts(suggestions.slice(0, 3));
      }
    }
  }, [messages]);

  // Auto-save conversation
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(`ai-conversation-${conversationId}`, JSON.stringify({
        messages,
        persona: currentPersona,
        timestamp: new Date().toISOString()
      }));
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [messages, conversationId, currentPersona]);

  const handleSend = useCallback(() => {
    if (!input.trim() && attachedFiles.length === 0) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sent',
      persona: currentPersona,
      conversationId,
      attachments: attachedFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size
      }))
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsTyping(true);
    
    // Update usage stats
    setUsageStats(prev => ({
      ...prev,
      totalMessages: prev.totalMessages + 1
    }));
    
    // Simulate AI response with persona-specific content
    setTimeout(() => {
      const selectedPersona = personas.find(p => p.id === currentPersona);
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: generatePersonaResponse(userMessage.content, selectedPersona, userMessage.attachments),
        timestamp: new Date(),
        status: 'sent',
        persona: currentPersona,
        conversationId,
        tokens: Math.floor(Math.random() * 500) + 100
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      // Update token usage
      setUsageStats(prev => ({
        ...prev,
        totalTokens: prev.totalTokens + (aiResponse.tokens || 0)
      }));
    }, Math.random() * 2000 + 1000); // Variable response time
  }, [input, attachedFiles, currentPersona, conversationId, personas]);

  const generatePersonaResponse = (userInput: string, persona?: Persona, attachments?: any[]) => {
    const hasAttachments = attachments && attachments.length > 0;
    const attachmentText = hasAttachments ? `\n\n📁 **File Analysis:** I can see you've uploaded ${attachments!.length} file(s). ` : '';
    
    switch (persona?.id) {
      case 'marketing':
        return `🎯 **Marketing Strategy Insight:**\n\n${userInput}\n\nAs your Marketing Expert, I recommend a strategic approach. Let me analyze this from a campaign performance and ROI perspective...${attachmentText}\n\n**Next Steps:**\n• Market segmentation analysis\n• Competitor benchmarking\n• ROI projection modeling`;
      
      case 'email':
        return `📧 **Email Specialist Analysis:**\n\n${userInput}\n\nFrom a deliverability and engagement standpoint, here's my professional assessment...${attachmentText}\n\n**Email Optimization Tips:**\n• Subject line A/B testing\n• Personalization strategies\n• Send time optimization`;
      
      case 'analytics':
        return `📊 **Data Analytics Perspective:**\n\n${userInput}\n\nLet me break down the key metrics and provide actionable insights...${attachmentText}\n\n**Analytics Recommendations:**\n• KPI tracking setup\n• Conversion funnel analysis\n• Statistical significance testing`;
      
      default:
        return `🤖 **AI Assistant Response:**\n\n${userInput}\n\nI understand your request and I'm processing it using the ${model} model with temperature ${temperature[0]}.${attachmentText}\n\nHow can I help you take this further?`;
    }
  };

  const handleQuickAction = useCallback((action: QuickAction) => {
    setInput(action.prompt);
    inputRef.current?.focus();
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files.slice(0, 5 - prev.length)]); // Limit to 5 files
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleVoiceToggle = useCallback(() => {
    setVoiceMode(!voiceMode);
    if (!voiceMode) {
      // Start voice recognition simulation
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInput('Voice input: Create a welcome email for new subscribers');
      }, 3000);
    }
  }, [voiceMode]);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = messages
      .filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
      .map(m => ({
        messageId: m.id,
        content: m.content.substring(0, 100) + '...',
        timestamp: m.timestamp || new Date(),
        relevance: Math.random()
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
    
    setSearchResults(results);
  }, [messages]);

  const rateMessage = useCallback((messageId: string, rating: 1 | 2 | 3 | 4 | 5) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, rating } : m
    ));
    setShowFeedback(messageId);
  }, []);

  const exportConversation = useCallback(() => {
    const conversationData = {
      id: conversationId,
      persona: currentPersona,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        rating: m.rating
      })),
      stats: usageStats,
      exported: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${conversationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversationId, currentPersona, messages, usageStats]);

  const startNewConversation = useCallback(() => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setConversations(prev => [newId, ...prev]);
    setMessages([{
      id: 'welcome-' + newId,
      role: 'assistant',
      content: 'Hello! I\'m ready to help you with a fresh conversation. What would you like to work on?',
      timestamp: new Date(),
      conversationId: newId
    }]);
  }, []);

  const applyTemplate = useCallback((template: ConversationTemplate) => {
    const newMessages = template.messages.map(msg => ({
      id: crypto.randomUUID(),
      ...msg,
      timestamp: new Date(),
      conversationId
    }));
    
    setMessages(prev => [...prev, ...newMessages]);
    setShowTemplates(false);
  }, [conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = useCallback((date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  }, []);

  const getCurrentPersona = useCallback(() => {
    return personas.find(p => p.id === currentPersona) || personas[0];
  }, [personas, currentPersona]);

  const PersonaIcon = getCurrentPersona().icon;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br border ${
              currentPersona === 'marketing' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' :
              currentPersona === 'email' ? 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' :
              currentPersona === 'analytics' ? 'from-purple-500/20 to-pink-500/20 border-purple-500/30' :
              'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
            }`}>
              <PersonaIcon className={`w-6 h-6 ${
                currentPersona === 'marketing' ? 'text-green-400' :
                currentPersona === 'email' ? 'text-blue-400' :
                currentPersona === 'analytics' ? 'text-purple-400' :
                'text-cyan-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
                <ProBadge />
                <Badge variant="outline" className="text-xs border-border">
                  {getCurrentPersona().name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getCurrentPersona().description} • {usageStats.totalMessages} messages • {usageStats.totalTokens} tokens
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Conversation Management */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card/50 border-border">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                  Conversations
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border-border">
                <DropdownMenuItem onClick={startNewConversation}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportConversation}>
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export Chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSearch(!showSearch)}>
                  <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  Search History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice Controls */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleVoiceToggle}
                  className={cn(
                    "bg-card/50 border-border",
                    voiceMode && "border-cyan-500/50 bg-cyan-500/10"
                  )}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs">Recording...</span>
                    </div>
                  ) : (
                    <MicrophoneIcon className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{voiceMode ? 'Disable voice mode' : 'Enable voice input'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card/50 border-border">
                  <CogIcon className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">AI Assistant Settings</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Configure your AI assistant preferences and advanced options.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-white">AI Model</Label>
                        <Select value={model} onValueChange={setModel}>
                          <SelectTrigger className="bg-card/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o (Advanced)</SelectItem>
                            <SelectItem value="claude-3">Claude 3 (Analytical)</SelectItem>
                            <SelectItem value="gemini-pro">Gemini Pro (Creative)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-white">Temperature: {temperature[0]}</Label>
                        <Slider
                          value={temperature}
                          onValueChange={setTemperature}
                          max={2}
                          min={0}
                          step={0.1}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Lower = more focused, Higher = more creative
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-white">Stream responses</Label>
                        <Switch 
                          checked={streamMode} 
                          onCheckedChange={setStreamMode}
                          className="data-[state=checked]:bg-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-white mb-2 block">Usage Statistics</Label>
                        <div className="bg-card/50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Messages:</span>
                            <span className="text-white">{usageStats.totalMessages}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Tokens:</span>
                            <span className="text-white">{usageStats.totalTokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Response:</span>
                            <span className="text-white">{usageStats.avgResponseTime}s</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <Card className="bg-background/50 border-border">
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search through conversation history..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="bg-card/50 border-border"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSearch(false)}
                  className="bg-card/50 border-border"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-1">
                  {searchResults.map((result, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 bg-card/30 rounded border border-border cursor-pointer hover:bg-muted/30"
                      onClick={() => {
                        document.getElementById(result.messageId)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="text-muted-foreground truncate">{result.content}</div>
                      <div className="text-muted-foreground text-xs mt-1">{formatTimestamp(result.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          {/* Chat Panel - Takes 3 columns on desktop */}
          <Card className="lg:col-span-3 flex flex-col bg-background/50 border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold text-white">Conversation</CardTitle>
                  <Select value={currentPersona} onValueChange={setCurrentPersona}>
                    <SelectTrigger className="w-[180px] h-8 bg-card/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {personas.map(persona => {
                        const Icon = persona.icon;
                        return (
                          <SelectItem key={persona.id} value={persona.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {persona.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  {isTyping && (
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                      <span className="mr-2">{getCurrentPersona().name} is typing</span>
                      <span className="animate-pulse">●</span>
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-border">
                    {messages.length} messages
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border-border">
                      <DropdownMenuItem onClick={() => setShowTemplates(true)}>
                        <BookOpenIcon className="w-4 h-4 mr-2" />
                        Load Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportConversation}>
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        Export Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ShareIcon className="w-4 h-4 mr-2" />
                        Share with Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const messagePersona = personas.find(p => p.id === message.persona) || personas[0];
                    const MessageIcon = messagePersona.icon;
                    
                    return (
                      <div
                        key={message.id}
                        id={message.id}
                        className={cn(
                          "flex gap-3 group",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className={`w-8 h-8 border ${
                            message.persona === 'marketing' ? 'border-green-500/30' :
                            message.persona === 'email' ? 'border-blue-500/30' :
                            message.persona === 'analytics' ? 'border-purple-500/30' :
                            'border-cyan-500/30'
                          }`}>
                            <AvatarFallback className={`bg-gradient-to-br ${
                              message.persona === 'marketing' ? 'from-green-500/20 to-emerald-500/20 text-green-400' :
                              message.persona === 'email' ? 'from-blue-500/20 to-indigo-500/20 text-blue-400' :
                              message.persona === 'analytics' ? 'from-purple-500/20 to-pink-500/20 text-purple-400' :
                              'from-cyan-500/20 to-blue-500/20 text-cyan-400'
                            }`}>
                              <MessageIcon className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className="flex flex-col max-w-[75%]">
                          <div
                            className={cn(
                              "rounded-lg px-4 py-2 relative",
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-50'
                                : 'bg-card/50 border border-border text-foreground'
                            )}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                            
                            {/* Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {message.attachments.map((attachment) => (
                                  <Badge key={attachment.id} variant="outline" className="text-xs">
                                    <DocumentTextIcon className="w-3 h-3 mr-1" />
                                    {attachment.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs text-muted-foreground">
                                {formatTimestamp(message.timestamp)}
                                {message.tokens && (
                                  <span className="ml-2">• {message.tokens} tokens</span>
                                )}
                              </div>
                              
                              {/* Message actions */}
                              {message.role === 'assistant' && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => rateMessage(message.id, 5)}
                                  >
                                    <HandThumbUpIcon className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => rateMessage(message.id, 1)}
                                  >
                                    <HandThumbDownIcon className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => navigator.clipboard.writeText(message.content)}
                                  >
                                    <ClipboardDocumentListIcon className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Rating display */}
                            {message.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    className={cn(
                                      "w-3 h-3",
                                      star <= message.rating! ? "text-yellow-400 fill-current" : "text-muted-foreground"
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {message.role === 'user' && (
                          <Avatar className="w-8 h-8 border border-blue-500/30">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                              <UserCircleIcon className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8 border border-cyan-500/30">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card/50 border border-border rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Suggested Prompts */}
              {suggestedPrompts.length > 0 && (
                <div className="px-4 py-2 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <LightBulbIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-muted-foreground">Suggested follow-ups:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 bg-card/30 border-border hover:bg-muted/50"
                        onClick={() => setInput(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* File Attachments Display */}
              {attachedFiles.length > 0 && (
                <div className="px-4 py-2 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DocumentArrowUpIcon className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Attached files:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-1 bg-card/50 rounded px-2 py-1">
                        <FolderIcon className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeAttachment(index)}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ask ${getCurrentPersona().name} anything... (Shift+Enter for new line)`}
                      className="min-h-[60px] max-h-[120px] bg-card/50 border-border text-white placeholder:text-muted-foreground resize-none"
                      disabled={isTyping}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".txt,.pdf,.doc,.docx,.csv,.xlsx,.png,.jpg,.jpeg"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isTyping || attachedFiles.length >= 5}
                          className="h-8 text-xs"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                          Attach
                        </Button>
                        {voiceMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInput(input + ' [Voice note recorded]')}
                            className="h-8 text-xs"
                          >
                            <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                            Play
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {input.length} chars
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={handleSend} 
                              disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send message (Enter)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Sidebar - Takes 1 column on desktop */}
          <div className="space-y-4">
            {/* Persona Selector */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Personas
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Choose your AI specialist
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {personas.map(persona => {
                  const Icon = persona.icon;
                  return (
                    <Button
                      key={persona.id}
                      variant={currentPersona === persona.id ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-full justify-start p-3 h-auto",
                        currentPersona === persona.id
                          ? `bg-gradient-to-r border-${persona.color}-500/50`
                          : "bg-card/30 border-border hover:bg-muted/50"
                      )}
                      onClick={() => setCurrentPersona(persona.id)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Icon className={`w-5 h-5 mt-0.5 text-${persona.color}-400 flex-shrink-0`} />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{persona.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{persona.description}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {persona.expertise.slice(0, 2).map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs px-1 py-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
            {/* Quick Actions */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5 text-amber-400" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Click to use these prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-card/50">
                    <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                    <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content" className="space-y-2 mt-3">
                    {quickActions
                      .filter(a => a.category === 'content' || a.category === 'workflow')
                      .map(action => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left bg-card/30 border-border hover:bg-muted/50 hover:border-cyan-500/50 transition-all"
                          onClick={() => handleQuickAction(action)}
                        >
                          <action.icon className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                          <span className="text-xs truncate">{action.label}</span>
                        </Button>
                      ))}
                  </TabsContent>
                  <TabsContent value="analysis" className="space-y-2 mt-3">
                    {quickActions
                      .filter(a => a.category === 'analysis' || a.category === 'optimization')
                      .map(action => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left bg-card/30 border-border hover:bg-muted/50 hover:border-cyan-500/50 transition-all"
                          onClick={() => handleQuickAction(action)}
                        >
                          <action.icon className="w-4 h-4 mr-2 text-cyan-400 flex-shrink-0" />
                          <span className="text-xs truncate">{action.label}</span>
                        </Button>
                      ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <BeakerIcon className="w-5 h-5 text-purple-400" />
                  Quick Tools
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Launch specialized tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => navigate('/smtp-checker')}
                >
                  <CogIcon className="w-4 h-4 mr-2 text-green-400" />
                  SMTP Tester
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => navigate('/imap-inbox')}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-400" />
                  IMAP Inbox
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => navigate('/live-console')}
                >
                  <ChartBarIcon className="w-4 h-4 mr-2 text-orange-400" />
                  Live Console
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => navigate('/proxies')}
                >
                  <WrenchScrewdriverIcon className="w-4 h-4 mr-2 text-purple-400" />
                  Proxy Manager
                </Button>
              </CardContent>
            </Card>

            {/* Workflow Templates */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-emerald-400" />
                  Workflows
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Pre-built campaign templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setInput('Create a welcome series workflow with 5 emails')}
                  >
                    Welcome Series
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => setInput('Design a re-engagement campaign for inactive users')}
                  >
                    Re-engagement
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => setInput('Build an abandoned cart recovery sequence')}
                  >
                    Cart Recovery
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => setInput('Create a weekly newsletter template')}
                  >
                    Newsletter
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                    onClick={() => setInput('Design a product launch email sequence')}
                  >
                    Product Launch
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Templates */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                  Templates
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Start with proven workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => setShowTemplates(true)}
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 mr-2 text-indigo-400" />
                  Browse Templates
                </Button>
                {conversationTemplates.slice(0, 2).map(template => {
                  const Icon = template.icon;
                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left bg-card/30 border-border hover:bg-muted/50 h-auto p-2"
                      onClick={() => applyTemplate(template)}
                    >
                      <Icon className="w-4 h-4 mr-2 text-emerald-400 flex-shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{template.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Usage Analytics */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-orange-400" />
                  Usage Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Messages Today</span>
                    <span className="text-sm font-medium text-white">{usageStats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Tokens Used</span>
                    <span className="text-sm font-medium text-white">{usageStats.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Avg Response</span>
                    <span className="text-sm font-medium text-white">{usageStats.avgResponseTime}s</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">75% of daily limit</div>
                </div>
              </CardContent>
            </Card>

            {/* Team Collaboration */}
            <Card className="bg-background/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-green-400" />
                  Team Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => navigator.share?.({ title: 'AI Conversation', url: window.location.href })}
                >
                  <ShareIcon className="w-4 h-4 mr-2 text-green-400" />
                  Share Chat
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full justify-start bg-card/30 border-border hover:bg-muted/50"
                  onClick={() => alert('Collaboration invite sent!')}
                >
                  <UserGroupIcon className="w-4 h-4 mr-2 text-blue-400" />
                  Invite Team
                </Button>
                {collaborators.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {collaborators.length} team member(s) active
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Model Settings Info */}
            <Alert className="bg-card/30 border-cyan-500/30">
              <SparklesIcon className="h-4 w-4 text-cyan-400" />
              <AlertTitle className="text-cyan-400">AI Model Active</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                Using {model} with {getCurrentPersona().name} persona • Temperature {temperature[0]}
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Template Selection Dialog */}
        <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
          <DialogContent className="bg-background border-border max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white">Conversation Templates</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Start your conversation with proven templates and workflows.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {conversationTemplates.map(template => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="bg-card/50 border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Icon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base text-white">{template.name}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </CardDescription>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {template.messages.slice(0, 2).map((msg, index) => (
                          <div key={index} className="text-xs p-2 bg-background/50 rounded border border-border">
                            <div className="font-medium text-muted-foreground mb-1">
                              {msg.role === 'user' ? 'You' : 'AI'}
                            </div>
                            <div className="text-muted-foreground line-clamp-2">
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        onClick={() => applyTemplate(template)}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={!!showFeedback} onOpenChange={() => setShowFeedback(null)}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Provide Feedback</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Help us improve the AI assistant with your feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="What could be improved about this response?"
                className="bg-card/50 border-border text-white"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFeedback(null)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                  onClick={() => {
                    setShowFeedback(null);
                    // Here you would submit the feedback
                  }}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
};