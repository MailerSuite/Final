import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import PageShell from '../components/PageShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import ProBadge from '@/components/ui/ProBadge';
import { toast } from '@/hooks/useToast';
import {
  SparklesIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  CpuChipIcon,
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  TrashIcon,
  BeakerIcon,
  ClockIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  CursorArrowRaysIcon,
  EnvelopeIcon,
  BookmarkIcon,
  ArchiveBoxIcon,
  TagIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  ListBulletIcon,
  CommandLineIcon,
  WrenchScrewdriverIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

interface GeneratedContent {
  id: string;
  type: 'subject' | 'body' | 'cta' | 'preheader';
  content: string;
  score: number;
  metrics: {
    engagement: number;
    deliverability: number;
    personalization: number;
    urgency: number;
    clarity: number;
    emotional_impact: number;
    spam_risk: number;
    ab_test_potential: number;
  };
  tags: string[];
  favorite?: boolean;
  bookmarked?: boolean;
  created_at: Date;
  template_id?: string;
  performance_prediction: {
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
    confidence: number;
  };
  ab_variants?: GeneratedContent[];
  campaign_context?: {
    campaign_id: string;
    campaign_name: string;
    audience_segment: string;
  };
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'subject' | 'body' | 'cta' | 'preheader';
  template: string;
  variables: string[];
  category: string;
  industry: string[];
  tags: string[];
  usage_count: number;
  performance_score: number;
  is_favorite: boolean;
}

interface GenerationSettings {
  tone: 'professional' | 'casual' | 'urgent' | 'friendly' | 'promotional' | 'luxury' | 'tech' | 'conversational';
  industry: 'saas' | 'ecommerce' | 'fintech' | 'crypto' | 'healthcare' | 'education' | 'general' | 'retail' | 'b2b' | 'nonprofit';
  length: 'short' | 'medium' | 'long';
  creativity: number;
  personalization: boolean;
  emoji: boolean;
  urgency: boolean;
  callToAction: boolean;
  target_audience: 'executives' | 'developers' | 'marketers' | 'general' | 'millennials' | 'gen_z' | 'boomers';
  goals: ('awareness' | 'conversion' | 'retention' | 'engagement' | 'education')[];
  ab_testing: boolean;
  content_strategy: 'informative' | 'persuasive' | 'entertaining' | 'educational' | 'inspirational';
  compliance_level: 'standard' | 'strict' | 'custom';
  brand_voice?: string;
  exclude_keywords?: string[];
  include_keywords?: string[];
}

interface ContentHistory {
  id: string;
  session_id: string;
  prompt: string;
  settings: GenerationSettings;
  results: GeneratedContent[];
  created_at: Date;
  notes?: string;
}

interface ABTestSuggestion {
  id: string;
  original_content: string;
  variant_content: string;
  test_hypothesis: string;
  expected_improvement: number;
  confidence_level: number;
  test_duration_days: number;
  sample_size_needed: number;
}

const defaultSettings: GenerationSettings = {
  tone: 'professional',
  industry: 'general',
  length: 'medium',
  creativity: 7,
  personalization: true,
  emoji: false,
  urgency: false,
  callToAction: true,
  target_audience: 'general',
  goals: ['conversion'],
  ab_testing: false,
  content_strategy: 'persuasive',
  compliance_level: 'standard'
};

const contentTemplates: ContentTemplate[] = [
  {
    id: 'welcome-series-1',
    name: 'Welcome Email Subject',
    description: 'High-converting welcome email subject line template',
    type: 'subject',
    template: 'Welcome to {{COMPANY_NAME}}, {{FIRST_NAME}}! {{BENEFIT}}',
    variables: ['COMPANY_NAME', 'FIRST_NAME', 'BENEFIT'],
    category: 'Welcome Series',
    industry: ['saas', 'ecommerce', 'general'],
    tags: ['welcome', 'onboarding', 'personalized'],
    usage_count: 1247,
    performance_score: 92,
    is_favorite: true
  },
  {
    id: 'promo-urgency-1',
    name: 'Limited Time Offer',
    description: 'Creates urgency for promotional campaigns',
    type: 'subject',
    template: '⏰ {{HOURS_LEFT}} hours left: {{DISCOUNT}}% off {{PRODUCT}}',
    variables: ['HOURS_LEFT', 'DISCOUNT', 'PRODUCT'],
    category: 'Promotional',
    industry: ['ecommerce', 'retail'],
    tags: ['urgency', 'discount', 'promotion'],
    usage_count: 3421,
    performance_score: 87,
    is_favorite: false
  },
  {
    id: 'newsletter-1',
    name: 'Weekly Newsletter',
    description: 'Engaging newsletter subject line',
    type: 'subject',
    template: '📊 This week: {{TOPIC}} + {{INSIGHT}}',
    variables: ['TOPIC', 'INSIGHT'],
    category: 'Newsletter',
    industry: ['saas', 'b2b', 'education'],
    tags: ['newsletter', 'weekly', 'insights'],
    usage_count: 856,
    performance_score: 78,
    is_favorite: false
  }
];

const predefinedPrompts = [
  { category: 'E-commerce', prompts: ['New product launch', 'Black Friday sale', 'Cart abandonment', 'Customer review request', 'Loyalty program'] },
  { category: 'SaaS', prompts: ['Feature announcement', 'Free trial ending', 'Onboarding sequence', 'Product update', 'Upgrade notification'] },
  { category: 'Newsletter', prompts: ['Weekly roundup', 'Industry insights', 'Company news', 'Expert interview', 'Community highlights'] },
  { category: 'Event', prompts: ['Webinar invitation', 'Conference announcement', 'Event reminder', 'Post-event follow-up', 'VIP invitation'] }
];

const AIContentGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [contentType, setContentType] = useState<'subject' | 'body' | 'cta' | 'preheader'>('subject');
  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>(defaultSettings);
  const [generated, setGenerated] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [favorites, setFavorites] = useState<GeneratedContent[]>([]);
  const [bookmarks, setBookmarks] = useState<GeneratedContent[]>([]);
  const [contentHistory, setContentHistory] = useState<ContentHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'performance'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<ContentTemplate[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [abTestSuggestions, setAbTestSuggestions] = useState<ABTestSuggestion[]>([]);
  const [campaignContext, setCampaignContext] = useState<{ id: string; name: string; audience: string } | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<unknown>(null);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);
  const reduceMotion = useReducedMotion();

  // Memoized filtered and sorted content
  const filteredContent = useMemo(() => {
    let filtered = generated;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'performance':
          return b.performance_prediction.conversion_rate - a.performance_prediction.conversion_rate;
        default:
          return 0;
      }
    });
  }, [generated, searchQuery, filterType, sortBy]);

  // Real-time content analysis
  useEffect(() => {
    if (realTimeAnalysis && prompt.length > 10) {
      const timer = setTimeout(() => {
        analyzePrompt(prompt);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [prompt, realTimeAnalysis]);

  const analyzePrompt = useCallback(async (text: string) => {
    try {
      // Simulate real-time analysis
      const analysis = {
        sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
        readability: Math.floor(Math.random() * 30) + 70,
        keywords: text.split(' ').filter(word => word.length > 3).slice(0, 3),
        suggestions: [
          'Consider adding emotional triggers',
          'Include specific benefits',
          'Add urgency indicators'
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      };
      setAnalysisResults(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error?.('Please enter a prompt or topic');
      return;
    }

    setLoading(true);
    try {
      // Simulate AI generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const baseCount = settings.ab_testing ? 3 : 5;
      const mockGenerated: GeneratedContent[] = Array.from({ length: baseCount }, (_, i) => {
        const content = generateMockContent(contentType, prompt, settings, i);
        const baseItem: GeneratedContent = {
          id: `gen-${Date.now()}-${i}`,
          type: contentType,
          content,
          score: Math.floor(Math.random() * 30) + 70,
          metrics: {
            engagement: Math.floor(Math.random() * 30) + 70,
            deliverability: Math.floor(Math.random() * 20) + 80,
            personalization: settings.personalization ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 40) + 30,
            urgency: settings.urgency ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30,
            clarity: Math.floor(Math.random() * 25) + 75,
            emotional_impact: Math.floor(Math.random() * 35) + 65,
            spam_risk: Math.floor(Math.random() * 30) + 10,
            ab_test_potential: Math.floor(Math.random() * 40) + 60
          },
          tags: generateTags(settings),
          created_at: new Date(),
          performance_prediction: {
            open_rate: Math.floor(Math.random() * 30) + 20,
            click_rate: Math.floor(Math.random() * 15) + 5,
            conversion_rate: Math.floor(Math.random() * 10) + 2,
            confidence: Math.floor(Math.random() * 30) + 70
          },
          campaign_context: campaignContext ? {
            campaign_id: campaignContext.id,
            campaign_name: campaignContext.name,
            audience_segment: campaignContext.audience
          } : undefined
        };

        // Generate A/B test variants if enabled
        if (settings.ab_testing && i === 0) {
          baseItem.ab_variants = Array.from({ length: 2 }, (_, vi) => ({
            ...baseItem,
            id: `gen-${Date.now()}-${i}-variant-${vi}`,
            content: generateMockContent(contentType, prompt, { ...settings, creativity: settings.creativity + (vi + 1) * 2 }, vi + 10),
            score: baseItem.score + (Math.random() > 0.5 ? 5 : -5)
          }));
        }

        return baseItem;
      });

      setGenerated(prev => [...mockGenerated, ...prev]);

      // Generate A/B test suggestions
      if (settings.ab_testing) {
        const suggestions = generateABTestSuggestions(mockGenerated[0]);
        setAbTestSuggestions(suggestions);
      }

      // Add to history
      const historyEntry: ContentHistory = {
        id: `hist-${Date.now()}`,
        session_id: `session-${Date.now()}`,
        prompt,
        settings: { ...settings },
        results: mockGenerated,
        created_at: new Date()
      };
      setContentHistory(prev => [historyEntry, ...prev.slice(0, 19)]);

      toast.success?.(`Generated ${mockGenerated.length} ${contentType} options`);
    } catch (error) {
      toast.error?.('Failed to generate content');
    } finally {
      setLoading(false);
    }
  }, [prompt, contentType, settings, campaignContext]);

  const generateMockContent = (type: string, prompt: string, settings: GenerationSettings, index: number): string => {
    const variations = {
      subject: [
        `${settings.emoji ? '🚀 ' : ''}${prompt} - ${settings.urgency ? 'Limited Time' : 'New Update'}${settings.personalization ? ' for {{FIRST_NAME}}' : ''}`,
        `${settings.personalization ? '{{FIRST_NAME}}, ' : ''}${prompt} ${settings.urgency ? 'Ending Soon' : 'Available Now'}${settings.emoji ? ' ✨' : ''}`,
        `${settings.tone === 'urgent' ? 'URGENT: ' : ''}${prompt}${settings.emoji ? ' 🔥' : ''} - ${settings.callToAction ? 'Act Now' : 'Learn More'}`,
        `${prompt} - ${settings.callToAction ? 'Get Started Today' : 'Discover More'} ${settings.emoji ? '👍' : ''}${settings.urgency ? ' (Last Chance)' : ''}`,
        `${settings.tone === 'casual' ? 'Hey! ' : 'Exclusive: '}${prompt}${settings.urgency ? ' (48 Hours Left)' : ''}`
      ],
      body: [
        `Hi ${settings.personalization ? '{{FIRST_NAME}}' : 'there'},\n\nI wanted to share something exciting about ${prompt}. Our latest ${settings.industry} solution can help you achieve ${settings.goals.join(' and ')} better results.\n\n${settings.target_audience === 'executives' ? 'As a leader in your industry,' : 'Based on your interests,'} this could transform your ${settings.industry === 'saas' ? 'workflow' : 'business'}.\n\n${settings.callToAction ? 'Ready to get started? Click below!' : 'Let me know what you think.'}\n\nBest regards,\nThe Team`,
        `${settings.tone === 'casual' ? 'Hey there!' : 'Dear valued customer,'}\n\nWe've been working on ${prompt} and thought you'd be interested. This ${settings.industry} innovation focuses on ${settings.content_strategy} approaches.\n\n${settings.urgency ? 'Limited time offer - ' : ''}${settings.callToAction ? 'Learn more today!' : 'Hope this helps!'}\n\nCheers,\nYour Team`,
        `${prompt} is here! ${settings.emoji ? '🎉' : ''}\n\n${settings.personalization ? 'Based on your profile, ' : ''}this aligns perfectly with ${settings.goals.join(', ')} goals. Our ${settings.industry} expertise shows promising results for ${settings.target_audience} like you.\n\n${settings.callToAction ? 'Get started now →' : 'Explore the possibilities'}\n\nWarm regards,\nThe Team`
      ],
      cta: [
        `${settings.urgency ? 'Act Now' : 'Get Started'} ${settings.emoji ? '→' : ''}`,
        `${settings.tone === 'casual' ? 'Let\'s Go!' : 'Learn More'} ${settings.emoji ? '🚀' : ''}`,
        `${settings.urgency ? 'Limited Time' : 'Discover'} - ${prompt}`,
        `${settings.callToAction ? 'Start Your Journey' : 'Explore Options'} ${settings.emoji ? '✨' : ''}`,
        `${settings.tone === 'urgent' ? 'CLAIM NOW' : 'Try It Free'} ${settings.emoji ? '💎' : ''}`
      ],
      preheader: [
        `${prompt} - ${settings.urgency ? 'Don\'t miss out!' : 'New features inside'}${settings.personalization ? ' (Personalized for you)' : ''}`,
        `${settings.personalization ? 'Tailored for you: ' : ''}${prompt} updates for ${settings.target_audience}`,
        `${settings.emoji ? '👀 ' : ''}Preview: ${prompt} ${settings.urgency ? '(Limited time)' : 'innovation'}`,
        `${prompt} - ${settings.callToAction ? 'Action required' : 'FYI'} ${settings.emoji ? '📧' : ''}`,
        `${settings.tone === 'casual' ? 'Quick update: ' : 'Important: '}${prompt} for ${settings.industry} professionals`
      ]
    };

    return variations[type][index % variations[type].length] || variations[type][0];
  };

  const generateTags = (settings: GenerationSettings): string[] => {
    const tags = [settings.tone, settings.industry, settings.length, settings.target_audience, settings.content_strategy];
    if (settings.personalization) tags.push('personalized');
    if (settings.emoji) tags.push('emoji');
    if (settings.urgency) tags.push('urgent');
    if (settings.callToAction) tags.push('cta');
    if (settings.ab_testing) tags.push('ab-ready');
    tags.push(...settings.goals);
    return tags.filter(Boolean);
  };

  const generateABTestSuggestions = (content: GeneratedContent): ABTestSuggestion[] => {
    return [
      {
        id: `ab-1-${content.id}`,
        original_content: content.content,
        variant_content: content.content.replace(/!/g, '.').replace(/exciting/gi, 'innovative'),
        test_hypothesis: 'More conservative tone may improve professional audience engagement',
        expected_improvement: 15,
        confidence_level: 78,
        test_duration_days: 7,
        sample_size_needed: 1000
      },
      {
        id: `ab-2-${content.id}`,
        original_content: content.content,
        variant_content: content.content + ' (Limited seats available)',
        test_hypothesis: 'Adding scarcity may increase urgency and conversions',
        expected_improvement: 23,
        confidence_level: 85,
        test_duration_days: 5,
        sample_size_needed: 1500
      }
    ];
  };

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success?.('Copied to clipboard');
  }, []);

  const toggleFavorite = useCallback((item: GeneratedContent) => {
    const isFavorite = favorites.some(f => f.id === item.id);
    if (isFavorite) {
      setFavorites(prev => prev.filter(f => f.id !== item.id));
      toast.success?.('Removed from favorites');
    } else {
      setFavorites(prev => [...prev, { ...item, favorite: true }]);
      toast.success?.('Added to favorites');
    }
  }, [favorites]);

  const toggleBookmark = useCallback((item: GeneratedContent) => {
    const isBookmarked = bookmarks.some(b => b.id === item.id);
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.id !== item.id));
      toast.success?.('Removed bookmark');
    } else {
      setBookmarks(prev => [...prev, { ...item, bookmarked: true }]);
      toast.success?.('Added bookmark');
    }
  }, [bookmarks]);

  const exportContent = useCallback((format: 'csv' | 'json' | 'txt') => {
    let content = '';
    const data = filteredContent;

    switch (format) {
      case 'csv':
        content = 'Type,Content,Score,Created,Tags\n' +
          data.map(item => `"${item.type}","${item.content}","${item.score}","${item.created_at.toISOString()}","${item.tags.join(';')}"`).join('\n');
        break;
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'txt':
        content = data.map(item => `${item.type.toUpperCase()}: ${item.content}\nScore: ${item.score}\nTags: ${item.tags.join(', ')}\n---\n`).join('\n');
        break;
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-content-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success?.(`Exported ${data.length} items as ${format.toUpperCase()}`);
    setExportDialogOpen(false);
  }, [filteredContent]);

  const applyTemplate = useCallback((template: ContentTemplate) => {
    setPrompt(template.template);
    setContentType(template.type);
    setSettings(prev => ({
      ...prev,
      industry: template.industry[0] as GenerationSettings['industry'] || 'general'
    }));
    setTemplateDialogOpen(false);
    toast.success?.(`Applied template: ${template.name}`);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (score >= 80) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 30) return 'bg-emerald-500/10 text-emerald-500';
    if (rate >= 20) return 'bg-blue-500/10 text-blue-500';
    if (rate >= 10) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  return (
    <TooltipProvider>
      <PageShell
        title="AI Content Generator"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <SparklesIcon className="w-4 h-4 text-purple-500" />
          </span>
        }
        subtitle="Generate high-converting email content with advanced AI assistance and analytics"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Tools', href: '/ai' }, { label: 'Content Generator' }]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Templates ({contentTemplates.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Content Templates</DialogTitle>
                  <DialogDescription>
                    Choose from pre-built templates optimized for different industries and use cases
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {contentTemplates.map(template => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => applyTemplate(template)}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <Badge className={getPerformanceBadge(template.performance_score)}>
                              {template.performance_score}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-xs font-mono bg-muted p-2 rounded mb-2">
                            {template.template}
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{template.usage_count} uses</span>
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Content</DialogTitle>
                  <DialogDescription>
                    Export your generated content in various formats
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Exporting {filteredContent.length} items
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Button variant="outline" onClick={() => exportContent('csv')}>
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" onClick={() => exportContent('json')}>
                      <CommandLineIcon className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                    <Button variant="outline" onClick={() => exportContent('txt')}>
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      Text
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline">
              <ShareIcon className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button variant="outline">
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Analytics
              <ProBadge className="ml-2" />
            </Button>

            <Button variant="outline">
              <CpuChipIcon className="w-4 h-4 mr-2" />
              AI Settings
              <ProBadge className="ml-2" />
            </Button>
          </div>
        }
      >
        <motion.div
          className="relative z-10"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="generator">Generator</TabsTrigger>
              <TabsTrigger value="results">Results ({generated.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
              <TabsTrigger value="history">History ({contentHistory.length})</TabsTrigger>
              <TabsTrigger value="ab-testing">A/B Testing <ProBadge className="ml-1" /></TabsTrigger>
              <TabsTrigger value="analytics">Analytics <ProBadge className="ml-1" /></TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                        Content Generation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Campaign Context */}
                      {campaignContext && (
                        <Alert>
                          <EnvelopeIcon className="h-4 w-4" />
                          <AlertDescription>
                            Generating content for campaign: <strong>{campaignContext.name}</strong> (Audience: {campaignContext.audience})
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select value={contentType} onValueChange={(value) => setContentType(value as typeof contentType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="subject">Subject Lines</SelectItem>
                            <SelectItem value="body">Email Body</SelectItem>
                            <SelectItem value="cta">Call-to-Action</SelectItem>
                            <SelectItem value="preheader">Preheader Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="prompt">Topic or Description</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <LightBulbIcon className="w-4 h-4 mr-1" />
                                Prompts
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <Command>
                                <CommandInput placeholder="Search prompts..." />
                                <CommandEmpty>No prompts found.</CommandEmpty>
                                {predefinedPrompts.map(category => (
                                  <CommandGroup key={category.category} heading={category.category}>
                                    {category.prompts.map(p => (
                                      <CommandItem key={p} onSelect={() => setPrompt(p)}>
                                        {p}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                ))}
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Textarea
                          id="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g., New product launch, Black Friday sale, Newsletter signup..."
                          className="min-h-24"
                        />

                        {/* Real-time Analysis */}
                        {realTimeAnalysis && analysisResults && prompt.length > 10 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-muted/50 p-3 rounded-lg border text-sm"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <BeakerIcon className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">Real-time Analysis</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground">Sentiment: </span>
                                <Badge variant="secondary">{analysisResults.sentiment}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Readability: </span>
                                <span className={getScoreColor(analysisResults.readability)}>{analysisResults.readability}%</span>
                              </div>
                            </div>
                            {analysisResults.suggestions.length > 0 && (
                              <div className="mt-2">
                                <span className="text-muted-foreground text-xs">Suggestions:</span>
                                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                  {analysisResults.suggestions.map((suggestion: string, i: number) => (
                                    <li key={i}>• {suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tone</Label>
                          <Select value={settings.tone} onValueChange={(value) => setSettings(prev => ({ ...prev, tone: value as typeof settings.tone }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="luxury">Luxury</SelectItem>
                              <SelectItem value="tech">Tech-focused</SelectItem>
                              <SelectItem value="conversational">Conversational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Industry</Label>
                          <Select value={settings.industry} onValueChange={(value) => setSettings(prev => ({ ...prev, industry: value as typeof settings.industry }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="saas">SaaS</SelectItem>
                              <SelectItem value="ecommerce">E-commerce</SelectItem>
                              <SelectItem value="fintech">Fintech</SelectItem>
                              <SelectItem value="crypto">Crypto</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="b2b">B2B</SelectItem>
                              <SelectItem value="nonprofit">Non-profit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Target Audience</Label>
                          <Select value={settings.target_audience} onValueChange={(value) => setSettings(prev => ({ ...prev, target_audience: value as typeof settings.target_audience }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="executives">Executives</SelectItem>
                              <SelectItem value="developers">Developers</SelectItem>
                              <SelectItem value="marketers">Marketers</SelectItem>
                              <SelectItem value="millennials">Millennials</SelectItem>
                              <SelectItem value="gen_z">Gen Z</SelectItem>
                              <SelectItem value="boomers">Boomers</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Content Strategy</Label>
                          <Select value={settings.content_strategy} onValueChange={(value) => setSettings(prev => ({ ...prev, content_strategy: value as typeof settings.content_strategy }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="informative">Informative</SelectItem>
                              <SelectItem value="persuasive">Persuasive</SelectItem>
                              <SelectItem value="entertaining">Entertaining</SelectItem>
                              <SelectItem value="educational">Educational</SelectItem>
                              <SelectItem value="inspirational">Inspirational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Creativity Level: {settings.creativity}/10</Label>
                        <Slider
                          value={[settings.creativity]}
                          onValueChange={(value) => setSettings(prev => ({ ...prev, creativity: value[0] }))}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Conservative</span>
                          <span>Balanced</span>
                          <span>Creative</span>
                        </div>
                      </div>

                      {/* Advanced Settings Collapsible */}
                      <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0">
                            <span className="flex items-center gap-2">
                              <AdjustmentsHorizontalIcon className="w-4 h-4" />
                              Advanced Settings
                            </span>
                            {showAdvancedSettings ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="personalization">Personalization</Label>
                              <Switch
                                id="personalization"
                                checked={settings.personalization}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, personalization: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="emoji">Include Emojis</Label>
                              <Switch
                                id="emoji"
                                checked={settings.emoji}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emoji: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="urgency">Add Urgency</Label>
                              <Switch
                                id="urgency"
                                checked={settings.urgency}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, urgency: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="cta">Call-to-Action</Label>
                              <Switch
                                id="cta"
                                checked={settings.callToAction}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, callToAction: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="ab-testing">A/B Testing</Label>
                              <Switch
                                id="ab-testing"
                                checked={settings.ab_testing}
                                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, ab_testing: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="real-time-analysis">Real-time Analysis</Label>
                              <Switch
                                id="real-time-analysis"
                                checked={realTimeAnalysis}
                                onCheckedChange={setRealTimeAnalysis}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Goals (select multiple)</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['awareness', 'conversion', 'retention', 'engagement', 'education'] as const).map(goal => (
                                <Button
                                  key={goal}
                                  variant={settings.goals.includes(goal) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    setSettings(prev => ({
                                      ...prev,
                                      goals: prev.goals.includes(goal)
                                        ? prev.goals.filter(g => g !== goal)
                                        : [...prev.goals, goal]
                                    }));
                                  }}
                                >
                                  {goal}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="include-keywords">Include Keywords</Label>
                              <Input
                                id="include-keywords"
                                placeholder="keyword1, keyword2"
                                value={settings.include_keywords?.join(', ') || ''}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  include_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                                }))}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="exclude-keywords">Exclude Keywords</Label>
                              <Input
                                id="exclude-keywords"
                                placeholder="spam, free"
                                value={settings.exclude_keywords?.join(', ') || ''}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  exclude_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                                }))}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="brand-voice">Brand Voice Description</Label>
                            <Textarea
                              id="brand-voice"
                              placeholder="Describe your brand's voice and personality..."
                              value={settings.brand_voice || ''}
                              onChange={(e) => setSettings(prev => ({ ...prev, brand_voice: e.target.value }))}
                              className="min-h-16"
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
                        {loading ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            Generating Advanced Content...
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Generate Content {settings.ab_testing && '+ A/B Variants'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Analytics & Preview Panel */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-blue-500" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <div className="text-2xl font-bold text-blue-500">{generated.length}</div>
                          <div className="text-xs text-muted-foreground">Generated</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <div className="text-2xl font-bold text-yellow-500">{favorites.length}</div>
                          <div className="text-xs text-muted-foreground">Favorites</div>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <div className="text-2xl font-bold text-green-500">{bookmarks.length}</div>
                          <div className="text-xs text-muted-foreground">Bookmarks</div>
                        </div>
                        <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <div className="text-2xl font-bold text-purple-500">{contentHistory.length}</div>
                          <div className="text-xs text-muted-foreground">Sessions</div>
                        </div>
                      </div>

                      {generated.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Average Scores</div>
                          <div className="space-y-2">
                            {[
                              { key: 'engagement', label: 'Engagement' },
                              { key: 'deliverability', label: 'Deliverability' },
                              { key: 'clarity', label: 'Clarity' },
                              { key: 'emotional_impact', label: 'Emotion' }
                            ].map(metric => {
                              const avg = Math.round(generated.reduce((a, b) => a + b.metrics[metric.key as keyof typeof b.metrics], 0) / generated.length);
                              return (
                                <div key={metric.key} className="flex justify-between items-center text-sm">
                                  <span>{metric.label}</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={avg} className="w-16 h-2" />
                                    <span className={getScoreColor(avg)}>{avg}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                        Performance Predictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {generated.length > 0 ? (
                        <div className="space-y-3">
                          {[
                            { key: 'open_rate', label: 'Open Rate', suffix: '%' },
                            { key: 'click_rate', label: 'Click Rate', suffix: '%' },
                            { key: 'conversion_rate', label: 'Conversion', suffix: '%' }
                          ].map(metric => {
                            const avg = Math.round(generated.reduce((a, b) => a + b.performance_prediction[metric.key as keyof typeof b.performance_prediction], 0) / generated.length);
                            return (
                              <div key={metric.key} className="flex justify-between items-center text-sm">
                                <span>{metric.label}</span>
                                <Badge className={getPerformanceBadge(avg)}>
                                  {avg}{metric.suffix}
                                </Badge>
                              </div>
                            );
                          })}
                          <div className="text-xs text-muted-foreground mt-2">
                            Based on historical data and AI analysis
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm py-4">
                          Generate content to see predictions
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EyeIcon className="w-5 h-5 text-green-500" />
                        Optimization Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <FireIcon className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <span>High urgency can increase open rates by 20-30%</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <HeartIcon className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                        <span>Personalization improves engagement by up to 50%</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <BoltIcon className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span>Clear CTAs boost click-through rates significantly</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <BeakerIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>A/B testing can improve performance by 15-25%</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <UserGroupIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                        <span>Audience-specific content performs 40% better</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Results Preview */}
              {generated.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Latest Generated Content</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        >
                          {viewMode === 'grid' ? <ListBulletIcon className="w-4 h-4" /> : <Squares2X2Icon className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                      {generated.slice(0, 6).map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getScoreBadge(item.score)}>Score: {item.score}</Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => toggleFavorite(item)}
                                  >
                                    {favorites.some(f => f.id === item.id) ? (
                                      <HeartIconSolid className="w-4 h-4 text-pink-500" />
                                    ) : (
                                      <HeartIcon className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {favorites.some(f => f.id === item.id) ? 'Remove from favorites' : 'Add to favorites'}
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => toggleBookmark(item)}
                                  >
                                    {bookmarks.some(b => b.id === item.id) ? (
                                      <BookmarkIconSolid className="w-4 h-4 text-blue-500" />
                                    ) : (
                                      <BookmarkIcon className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {bookmarks.some(b => b.id === item.id) ? 'Remove bookmark' : 'Bookmark'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="text-sm font-mono bg-muted p-3 rounded border-l-4 border-primary/30">
                            {item.content}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <span className={getPerformanceBadge(item.performance_prediction.open_rate)}>
                                {item.performance_prediction.open_rate}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Click Rate:</span>
                              <span className={getPerformanceBadge(item.performance_prediction.click_rate)}>
                                {item.performance_prediction.click_rate}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(item.content)}>
                              <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                              Copy
                            </Button>
                            {item.ab_variants && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.ab_variants.length} variants
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Generated Content ({filteredContent.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                          placeholder="Search content..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-32">
                          <FunnelIcon className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="subject">Subjects</SelectItem>
                          <SelectItem value="body">Bodies</SelectItem>
                          <SelectItem value="cta">CTAs</SelectItem>
                          <SelectItem value="preheader">Preheaders</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">Score</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      >
                        {viewMode === 'grid' ? <ListBulletIcon className="w-4 h-4" /> : <ViewColumnsIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-6" />
                          </div>
                          <Skeleton className="h-20 w-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredContent.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No content found</p>
                      <p className="text-sm">
                        {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Use the generator tab to create AI content'}
                      </p>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                      <AnimatePresence>
                        {filteredContent.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-4 border rounded-lg space-y-3 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getScoreBadge(item.score)}>
                                  Score: {item.score}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                                {item.campaign_context && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="secondary" className="text-xs">
                                        <EnvelopeIcon className="w-3 h-3 mr-1" />
                                        Campaign
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {item.campaign_context.campaign_name}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => toggleFavorite(item)}
                                    >
                                      {favorites.some(f => f.id === item.id) ? (
                                        <HeartIconSolid className="w-4 h-4 text-pink-500" />
                                      ) : (
                                        <HeartIcon className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {favorites.some(f => f.id === item.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => toggleBookmark(item)}
                                    >
                                      {bookmarks.some(b => b.id === item.id) ? (
                                        <BookmarkIconSolid className="w-4 h-4 text-blue-500" />
                                      ) : (
                                        <BookmarkIcon className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {bookmarks.some(b => b.id === item.id) ? 'Remove bookmark' : 'Bookmark'}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => copyToClipboard(item.content)}
                                    >
                                      <ClipboardDocumentIcon className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            <div className="bg-muted p-3 rounded font-mono text-sm border-l-4 border-primary/30">
                              {item.content}
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-xs">
                              {[
                                { key: 'engagement', label: 'Engage' },
                                { key: 'deliverability', label: 'Deliver' },
                                { key: 'clarity', label: 'Clarity' },
                                { key: 'emotional_impact', label: 'Emotion' }
                              ].map(metric => (
                                <div key={metric.key} className="text-center">
                                  <div className={`font-bold ${getScoreColor(item.metrics[metric.key as keyof typeof item.metrics])}`}>
                                    {item.metrics[metric.key as keyof typeof item.metrics]}%
                                  </div>
                                  <div className="text-muted-foreground">{metric.label}</div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center">
                                <div className={`font-bold ${getPerformanceBadge(item.performance_prediction.open_rate)}`}>
                                  {item.performance_prediction.open_rate}%
                                </div>
                                <div className="text-muted-foreground">Open Rate</div>
                              </div>
                              <div className="text-center">
                                <div className={`font-bold ${getPerformanceBadge(item.performance_prediction.click_rate)}`}>
                                  {item.performance_prediction.click_rate}%
                                </div>
                                <div className="text-muted-foreground">Click Rate</div>
                              </div>
                              <div className="text-center">
                                <div className={`font-bold ${getPerformanceBadge(item.performance_prediction.conversion_rate)}`}>
                                  {item.performance_prediction.conversion_rate}%
                                </div>
                                <div className="text-muted-foreground">Convert</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                              {item.ab_variants && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.ab_variants.length} A/B variants
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartIcon className="w-5 h-5 text-pink-500" />
                    Favorite Content ({favorites.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <HeartIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No favorites yet</p>
                      <p className="text-sm">Heart content from the results to save it here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 border rounded-lg space-y-3 bg-gradient-to-br from-pink-50/50 to-red-50/50 border-pink-200/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getScoreBadge(item.score)}>
                                Score: {item.score}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {item.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => toggleFavorite(item)}
                              >
                                <HeartIconSolid className="w-4 h-4 text-pink-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(item.content)}
                              >
                                <ClipboardDocumentIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="bg-white/80 p-3 rounded font-mono text-sm border">
                            {item.content}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className={`font-bold ${getPerformanceBadge(item.performance_prediction.open_rate)}`}>
                                {item.performance_prediction.open_rate}%
                              </div>
                              <div className="text-muted-foreground">Open</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-bold ${getPerformanceBadge(item.performance_prediction.click_rate)}`}>
                                {item.performance_prediction.click_rate}%
                              </div>
                              <div className="text-muted-foreground">Click</div>
                            </div>
                            <div className="text-center">
                              <div className={`font-bold ${getPerformanceBadge(item.performance_prediction.conversion_rate)}`}>
                                {item.performance_prediction.conversion_rate}%
                              </div>
                              <div className="text-muted-foreground">Convert</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    Generation History ({contentHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contentHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No history yet</p>
                      <p className="text-sm">Your generation sessions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contentHistory.map((session) => (
                        <Card key={session.id} className="border-l-4 border-blue-500">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">{session.prompt}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(session.created_at).toLocaleString()} • {session.results.length} results
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {session.settings.tone} • {session.settings.industry}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {session.results.slice(0, 3).map((result, idx) => (
                                <div key={idx} className="p-2 bg-muted rounded text-xs font-mono">
                                  {result.content.length > 50 ? result.content.substring(0, 50) + '...' : result.content}
                                </div>
                              ))}
                              {session.results.length > 3 && (
                                <div className="p-2 bg-muted/50 rounded text-xs text-center text-muted-foreground">
                                  +{session.results.length - 3} more
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ab-testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BeakerIcon className="w-5 h-5 text-purple-500" />
                    A/B Testing Suggestions
                    <ProBadge className="ml-2" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {abTestSuggestions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BeakerIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No A/B test suggestions yet</p>
                      <p className="text-sm">Enable A/B testing in generator settings to see suggestions</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {abTestSuggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="border-l-4 border-purple-500">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{suggestion.test_hypothesis}</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                  <span>Expected improvement: <strong className="text-green-500">+{suggestion.expected_improvement}%</strong></span>
                                  <span>Confidence: <strong>{suggestion.confidence_level}%</strong></span>
                                  <span>Duration: <strong>{suggestion.test_duration_days} days</strong></span>
                                  <span>Sample size: <strong>{suggestion.sample_size_needed.toLocaleString()}</strong></span>
                                </div>
                              </div>
                              <Badge className="bg-purple-500/10 text-purple-500">
                                A/B Test Ready
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Original (Control)</Label>
                                <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded text-sm font-mono">
                                  {suggestion.original_content}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Variant (Test)</Label>
                                <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded text-sm font-mono">
                                  {suggestion.variant_content}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                                Copy Test Plan
                              </Button>
                              <Button size="sm">
                                <RocketLaunchIcon className="w-4 h-4 mr-2" />
                                Create Campaign
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PresentationChartLineIcon className="w-5 h-5 text-blue-500" />
                    Content Performance Analytics
                    <ProBadge className="ml-2" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Generated</p>
                          <p className="text-2xl font-bold">{generated.length}</p>
                        </div>
                        <SparklesIcon className="w-8 h-8 text-blue-500" />
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                          <p className="text-2xl font-bold">
                            {generated.length > 0 ? Math.round(generated.reduce((a, b) => a + b.score, 0) / generated.length) : 0}
                          </p>
                        </div>
                        <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Favorites</p>
                          <p className="text-2xl font-bold">{favorites.length}</p>
                        </div>
                        <HeartIcon className="w-8 h-8 text-pink-500" />
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Sessions</p>
                          <p className="text-2xl font-bold">{contentHistory.length}</p>
                        </div>
                        <ArchiveBoxIcon className="w-8 h-8 text-purple-500" />
                      </div>
                    </Card>
                  </div>

                  <Alert>
                    <SparklesIcon className="h-4 w-4" />
                    <AlertDescription>
                      Advanced analytics including performance tracking, audience insights, and ROI analysis are coming soon.
                      Upgrade to Pro to get early access to these enterprise features.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default AIContentGenerator;