import React, { useState, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import PageShell from '../components/PageShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import ProBadge from '@/components/ui/ProBadge';
import { toast } from '@/hooks/useToast';
import {
  CpuChipIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  HeartIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  BoltIcon,
  ArrowPathIcon,
  PlayIcon,
  ClockIcon,
  UserGroupIcon,
  MapIcon,
  BeakerIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
  CogIcon,
  CalendarIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  AcademicCapIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  LinkIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon,
  StarIcon,
  FireIcon,
  TrophyIcon,
  RocketLaunchIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';

import { Accessibility as AccessibilityIcon } from 'lucide-react';

// Enhanced interfaces for advanced features
interface OptimizationResult {
  category: 'deliverability' | 'engagement' | 'spam' | 'accessibility' | 'design' | 'personalization' | 'timing' | 'mobile' | 'roi';
  type: 'error' | 'warning' | 'success' | 'improvement' | 'critical' | 'optimization';
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  fix?: string;
  score?: number;
  confidence?: number;
  priority?: number;
}

interface EmailAnalysis {
  overallScore: number;
  subjectScore: number;
  contentScore: number;
  deliverabilityScore: number;
  engagementScore: number;
  spamScore: number;
  accessibilityScore: number;
  mobileScore: number;
  personalizationScore: number;
  roiPrediction: number;
  results: OptimizationResult[];
  suggestions: string[];
  timestamp: Date;
  processingTime: number;
}

interface ABTestVariant {
  id: string;
  name: string;
  subject: string;
  content: string;
  expectedPerformance: number;
  confidence: number;
}

interface SendTimeOptimization {
  timezone: string;
  optimalTime: string;
  openRatePrediction: number;
  clickRatePrediction: number;
  confidence: number;
  reasoning: string;
}

interface AudienceSegment {
  id: string;
  name: string;
  size: number;
  characteristics: string[];
  engagementScore: number;
  recommendedApproach: string;
}

interface OptimizationHistory {
  id: string;
  timestamp: Date;
  emailTitle: string;
  beforeScore: number;
  afterScore: number;
  improvements: string[];
  status: 'pending' | 'completed' | 'implemented';
}

interface PerformancePrediction {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  spamComplaintRate: number;
  estimatedROI: number;
  confidence: number;
}

interface ESPIntegration {
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  capabilities: string[];
  lastSync: Date;
}

const AIEmailOptimizer: React.FC = () => {
  // Core state
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('wizard');
  const reduceMotion = useReducedMotion();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    campaignType: '',
    audience: '',
    goal: '',
    timeline: '',
    budget: 0
  });

  // Advanced features state
  const [abTestVariants, setAbTestVariants] = useState<ABTestVariant[]>([]);
  const [sendTimeOptimization, setSendTimeOptimization] = useState<SendTimeOptimization | null>(null);
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>([]);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistory[]>([]);
  const [performancePrediction, setPerformancePrediction] = useState<PerformancePrediction | null>(null);
  const [espIntegrations, setESPIntegrations] = useState<ESPIntegration[]>([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState('');
  const [beforeAfterComparison, setBeforeAfterComparison] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [optimizationGoal, setOptimizationGoal] = useState('engagement');

  // Initialize data on component mount
  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Mock ESP integrations
    setESPIntegrations([
      {
        provider: 'Mailchimp',
        status: 'connected',
        capabilities: ['Templates', 'Analytics', 'A/B Testing'],
        lastSync: new Date()
      },
      {
        provider: 'SendGrid',
        status: 'connected',
        capabilities: ['Delivery Analytics', 'Reputation Monitoring'],
        lastSync: new Date()
      },
      {
        provider: 'Constant Contact',
        status: 'disconnected',
        capabilities: ['Automation', 'Segmentation'],
        lastSync: new Date(Date.now() - 86400000)
      }
    ]);

    // Mock audience segments
    setAudienceSegments([
      {
        id: '1',
        name: 'High-Value Customers',
        size: 2500,
        characteristics: ['Premium subscribers', 'High engagement', 'Recent purchases'],
        engagementScore: 92,
        recommendedApproach: 'Personalized premium content with exclusive offers'
      },
      {
        id: '2',
        name: 'New Subscribers',
        size: 1200,
        characteristics: ['Signed up in last 30 days', 'Low engagement', 'No purchases'],
        engagementScore: 45,
        recommendedApproach: 'Welcome series with educational content and introductory offers'
      },
      {
        id: '3',
        name: 'Re-engagement Targets',
        size: 800,
        characteristics: ['Inactive for 60+ days', 'Previously engaged', 'No recent opens'],
        engagementScore: 25,
        recommendedApproach: 'Win-back campaign with strong incentives and subject line urgency'
      }
    ]);

    // Mock optimization history
    setOptimizationHistory([
      {
        id: '1',
        timestamp: new Date(Date.now() - 86400000),
        emailTitle: 'Welcome Series #1',
        beforeScore: 67,
        afterScore: 89,
        improvements: ['Enhanced subject line', 'Added personalization', 'Improved CTA placement'],
        status: 'completed'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 172800000),
        emailTitle: 'Product Update Newsletter',
        beforeScore: 72,
        afterScore: 85,
        improvements: ['Mobile optimization', 'Reduced spam triggers', 'Better accessibility'],
        status: 'implemented'
      }
    ]);
  };

  const analyzeEmail = useCallback(async () => {
    if (!subject.trim() && !htmlContent.trim() && !textContent.trim()) {
      toast.error?.('Please provide email content to analyze');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      // Simulate AI analysis with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setRealTimeFeedback(`Analyzing... ${i}%`);
      }
      
      const processingTime = Date.now() - startTime;
      const mockAnalysis = generateAdvancedAnalysis(subject, htmlContent, textContent, processingTime);
      setAnalysis(mockAnalysis);
      
      // Generate related insights
      generateABTestVariants();
      generateSendTimeOptimization();
      generatePerformancePrediction();
      
      setActiveTab('results');
      toast.success?.('Comprehensive email analysis completed');
    } catch (error) {
      toast.error?.('Failed to analyze email');
    } finally {
      setLoading(false);
      setRealTimeFeedback('');
    }
  }, [subject, htmlContent, textContent]);

  const generateAdvancedAnalysis = (subject: string, html: string, text: string, processingTime: number): EmailAnalysis => {
    const results: OptimizationResult[] = [];
    let overallScore = 85;

    // Enhanced subject line analysis
    if (subject.length === 0) {
      results.push({
        category: 'engagement',
        type: 'critical',
        title: 'Missing Subject Line',
        description: 'Email is missing a subject line, which will severely impact deliverability',
        impact: 'critical',
        fix: 'Add a compelling subject line to improve open rates',
        confidence: 100,
        priority: 1
      });
      overallScore -= 30;
    } else {
      // Advanced subject line scoring
      const subjectAnalysis = analyzeSubjectLine(subject);
      results.push(...subjectAnalysis.issues);
      overallScore += subjectAnalysis.scoreModifier;
    }

    // Advanced content analysis
    if (html) {
      const contentAnalysis = analyzeContent(html, text);
      results.push(...contentAnalysis.issues);
      overallScore += contentAnalysis.scoreModifier;
    }

    // Mobile optimization analysis
    const mobileAnalysis = analyzeMobileOptimization(html);
    results.push(...mobileAnalysis.issues);

    // Accessibility analysis
    const accessibilityAnalysis = analyzeAccessibility(html);
    results.push(...accessibilityAnalysis.issues);

    // Personalization analysis
    const personalizationAnalysis = analyzePersonalization(subject + html);
    results.push(...personalizationAnalysis.issues);

    // Advanced spam analysis
    const spamAnalysis = analyzeSpamRisk(subject, html, text);
    results.push(...spamAnalysis.issues);

    // Deliverability analysis
    const deliverabilityAnalysis = analyzeDeliverability(html, text);
    results.push(...deliverabilityAnalysis.issues);

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      subjectScore: calculateSubjectScore(subject),
      contentScore: calculateContentScore(html, text),
      deliverabilityScore: calculateDeliverabilityScore(html, text),
      engagementScore: calculateEngagementScore(subject, html),
      spamScore: calculateSpamScore(subject, html, text),
      accessibilityScore: calculateAccessibilityScore(html),
      mobileScore: calculateMobileScore(html),
      personalizationScore: calculatePersonalizationScore(subject + html),
      roiPrediction: calculateROIPrediction(subject, html, text),
      results: results.sort((a, b) => (b.priority || 0) - (a.priority || 0)),
      suggestions: generateAdvancedSuggestions(results),
      timestamp: new Date(),
      processingTime
    };
  };

  // Analysis helper functions
  const analyzeSubjectLine = (subject: string) => {
    const issues: OptimizationResult[] = [];
    let scoreModifier = 0;

    if (subject.length > 50) {
      issues.push({
        category: 'engagement',
        type: 'warning',
        title: 'Subject Line Too Long',
        description: `Subject line is ${subject.length} characters (optimal: 30-50)`,
        impact: 'medium',
        fix: 'Shorten subject line for better mobile display and higher open rates',
        confidence: 85,
        priority: 3
      });
      scoreModifier -= 5;
    }

    if (subject.includes('?')) {
      issues.push({
        category: 'engagement',
        type: 'success',
        title: 'Question-Based Subject Line',
        description: 'Questions can increase curiosity and open rates',
        impact: 'medium',
        confidence: 70,
        priority: 8
      });
      scoreModifier += 3;
    }

    if (/[0-9]/.test(subject)) {
      issues.push({
        category: 'engagement',
        type: 'success',
        title: 'Numbers in Subject Line',
        description: 'Numbers can improve click-through rates by up to 26%',
        impact: 'medium',
        confidence: 75,
        priority: 7
      });
      scoreModifier += 2;
    }

    return { issues, scoreModifier };
  };

  const analyzeContent = (html: string, text: string) => {
    const issues: OptimizationResult[] = [];
    let scoreModifier = 0;

    // Check for proper structure
    if (!html.includes('<h1>') && !html.includes('<h2>')) {
      issues.push({
        category: 'accessibility',
        type: 'warning',
        title: 'Missing Header Structure',
        description: 'No heading tags found, which impacts accessibility and SEO',
        impact: 'medium',
        fix: 'Add proper heading tags (h1, h2) to structure your content',
        confidence: 90,
        priority: 5
      });
      scoreModifier -= 3;
    }

    // Check for CTA optimization
    const ctaCount = (html.match(/button|btn|cta|call.*action/gi) || []).length;
    if (ctaCount === 0) {
      issues.push({
        category: 'engagement',
        type: 'error',
        title: 'No Call-to-Action Found',
        description: 'No clear call-to-action buttons or links detected',
        impact: 'high',
        fix: 'Add clear, prominent call-to-action buttons to drive engagement',
        confidence: 95,
        priority: 2
      });
      scoreModifier -= 10;
    } else if (ctaCount > 3) {
      issues.push({
        category: 'engagement',
        type: 'warning',
        title: 'Too Many Call-to-Actions',
        description: `${ctaCount} CTAs found. Multiple CTAs can dilute focus`,
        impact: 'medium',
        fix: 'Focus on 1-2 primary call-to-action buttons for better conversion',
        confidence: 80,
        priority: 4
      });
      scoreModifier -= 2;
    }

    return { issues, scoreModifier };
  };

  const analyzeMobileOptimization = (html: string) => {
    const issues: OptimizationResult[] = [];

    if (!html.includes('viewport') && !html.includes('@media')) {
      issues.push({
        category: 'mobile',
        type: 'error',
        title: 'Poor Mobile Optimization',
        description: 'Email lacks responsive design elements for mobile devices',
        impact: 'high',
        fix: 'Add responsive CSS and viewport meta tag for mobile optimization',
        confidence: 90,
        priority: 3
      });
    }

    if (html.includes('font-size') && !html.includes('min-width')) {
      issues.push({
        category: 'mobile',
        type: 'warning',
        title: 'Fixed Font Sizes',
        description: 'Using fixed font sizes may not scale well on mobile devices',
        impact: 'medium',
        fix: 'Use relative font sizes (em, rem, %) for better mobile experience',
        confidence: 75,
        priority: 5
      });
    }

    return { issues };
  };

  const analyzeAccessibility = (html: string) => {
    const issues: OptimizationResult[] = [];

    if (!html.includes('alt=')) {
      issues.push({
        category: 'accessibility',
        type: 'error',
        title: 'Missing Image Alt Text',
        description: 'Images without alt text are inaccessible to screen readers',
        impact: 'high',
        fix: 'Add descriptive alt attributes to all images',
        confidence: 100,
        priority: 4
      });
    }

    if (!html.includes('aria-') && !html.includes('role=')) {
      issues.push({
        category: 'accessibility',
        type: 'improvement',
        title: 'Enhanced Accessibility Features',
        description: 'Consider adding ARIA labels for better screen reader support',
        impact: 'medium',
        fix: 'Add ARIA labels and roles to improve accessibility',
        confidence: 70,
        priority: 6
      });
    }

    return { issues };
  };

  const analyzePersonalization = (content: string) => {
    const issues: OptimizationResult[] = [];
    const personalizationTokens = content.match(/\{\{[^}]+\}\}/g) || [];

    if (personalizationTokens.length === 0) {
      issues.push({
        category: 'personalization',
        type: 'improvement',
        title: 'No Personalization Detected',
        description: 'Personalized emails can improve engagement by up to 41%',
        impact: 'high',
        fix: 'Add personalization tokens like {{FIRST_NAME}} or {{COMPANY}}',
        confidence: 85,
        priority: 2
      });
    } else {
      issues.push({
        category: 'personalization',
        type: 'success',
        title: 'Personalization Found',
        description: `${personalizationTokens.length} personalization tokens detected`,
        impact: 'high',
        confidence: 90,
        priority: 9
      });
    }

    return { issues };
  };

  const analyzeSpamRisk = (subject: string, html: string, text: string) => {
    const issues: OptimizationResult[] = [];
    const spamWords = ['FREE', 'URGENT', 'CLICK NOW', 'LIMITED TIME', 'ACT NOW', 'GUARANTEED', 'NO OBLIGATION'];
    const content = (subject + html + text).toUpperCase();
    
    const foundSpamWords = spamWords.filter(word => content.includes(word));
    
    if (foundSpamWords.length > 0) {
      issues.push({
        category: 'spam',
        type: foundSpamWords.length > 2 ? 'error' : 'warning',
        title: 'Spam Trigger Words Detected',
        description: `Found ${foundSpamWords.length} potential spam triggers: ${foundSpamWords.join(', ')}`,
        impact: foundSpamWords.length > 2 ? 'critical' : 'high',
        fix: 'Replace or reduce spam trigger words to improve deliverability',
        confidence: 90,
        priority: 1
      });
    }

    return { issues };
  };

  const analyzeDeliverability = (html: string, text: string) => {
    const issues: OptimizationResult[] = [];

    if (!html.includes('unsubscribe') && !html.includes('{{UNSUBSCRIBE}}')) {
      issues.push({
        category: 'deliverability',
        type: 'critical',
        title: 'Missing Unsubscribe Link',
        description: 'Required by law and email providers for deliverability',
        impact: 'critical',
        fix: 'Add {{UNSUBSCRIBE}} macro or unsubscribe link',
        confidence: 100,
        priority: 1
      });
    }

    if (!text && html) {
      issues.push({
        category: 'deliverability',
        type: 'warning',
        title: 'Missing Plain Text Version',
        description: 'Plain text version improves deliverability and accessibility',
        impact: 'medium',
        fix: 'Provide a plain text alternative for better deliverability',
        confidence: 80,
        priority: 4
      });
    }

    return { issues };
  };

  // Score calculation functions
  const calculateSubjectScore = (subject: string): number => {
    let score = 80;
    if (subject.length === 0) score -= 40;
    else if (subject.length > 50) score -= 15;
    else if (subject.length < 30) score -= 5;
    if (subject.includes('?')) score += 5;
    if (/[0-9]/.test(subject)) score += 5;
    return Math.max(0, Math.min(100, score));
  };

  const calculateContentScore = (html: string, text: string): number => {
    let score = 75;
    if (html.includes('button') || html.includes('cta')) score += 10;
    if (html.includes('<h1>') || html.includes('<h2>')) score += 5;
    if (html.includes('alt=')) score += 5;
    if (text) score += 5;
    return Math.max(0, Math.min(100, score));
  };

  const calculateDeliverabilityScore = (html: string, text: string): number => {
    let score = 85;
    if (!html.includes('unsubscribe')) score -= 20;
    if (!text && html) score -= 10;
    if (html.includes('javascript:')) score -= 15;
    return Math.max(0, Math.min(100, score));
  };

  const calculateEngagementScore = (subject: string, html: string): number => {
    let score = 70;
    if (subject.includes('{{')) score += 15;
    if (html.includes('button')) score += 10;
    if (subject.includes('?')) score += 5;
    return Math.max(0, Math.min(100, score));
  };

  const calculateSpamScore = (subject: string, html: string, text: string): number => {
    const spamWords = ['FREE', 'URGENT', 'CLICK NOW', 'LIMITED TIME'];
    const content = (subject + html + text).toUpperCase();
    const spamCount = spamWords.filter(word => content.includes(word)).length;
    return Math.max(0, 100 - (spamCount * 15));
  };

  const calculateAccessibilityScore = (html: string): number => {
    let score = 70;
    if (html.includes('alt=')) score += 15;
    if (html.includes('aria-')) score += 10;
    if (html.includes('<h1>') || html.includes('<h2>')) score += 5;
    return Math.max(0, Math.min(100, score));
  };

  const calculateMobileScore = (html: string): number => {
    let score = 60;
    if (html.includes('viewport')) score += 20;
    if (html.includes('@media')) score += 15;
    if (html.includes('max-width')) score += 5;
    return Math.max(0, Math.min(100, score));
  };

  const calculatePersonalizationScore = (content: string): number => {
    const tokens = content.match(/\{\{[^}]+\}\}/g) || [];
    return Math.min(100, 30 + (tokens.length * 20));
  };

  const calculateROIPrediction = (subject: string, html: string, text: string): number => {
    // Simplified ROI calculation based on content quality
    let roi = 150; // Base ROI percentage
    if (subject.includes('{{')) roi += 25;
    if (html.includes('button')) roi += 20;
    if (html.includes('unsubscribe')) roi += 10;
    if (text) roi += 15;
    return Math.max(100, Math.min(300, roi));
  };

  const generateAdvancedSuggestions = (results: OptimizationResult[]): string[] => {
    const suggestions = [
      'Keep subject lines between 30-50 characters for optimal open rates',
      'Always include an unsubscribe link for legal compliance and deliverability',
      'Use merge tags for personalization to increase engagement by up to 41%',
      'Provide both HTML and plain text versions for better deliverability',
      'Test across multiple email clients and devices before sending',
      'Avoid spam trigger words and excessive capitalization',
      'Include alt text for all images to improve accessibility',
      'Use a clear hierarchy with proper heading tags (H1, H2)',
      'Limit call-to-action buttons to 1-2 for better focus',
      'Optimize for mobile with responsive design techniques'
    ];

    // Add specific suggestions based on analysis results
    const criticalIssues = results.filter(r => r.impact === 'critical');
    if (criticalIssues.length > 0) {
      suggestions.unshift('Address critical issues first to prevent delivery problems');
    }

    return suggestions;
  };

  const generateABTestVariants = () => {
    if (!subject) return;

    const variants: ABTestVariant[] = [
      {
        id: 'original',
        name: 'Original',
        subject: subject,
        content: htmlContent,
        expectedPerformance: 100,
        confidence: 100
      },
      {
        id: 'personalized',
        name: 'Personalized',
        subject: `{{FIRST_NAME}}, ${subject}`,
        content: htmlContent.replace(/Hello/g, 'Hello {{FIRST_NAME}}'),
        expectedPerformance: 125,
        confidence: 85
      },
      {
        id: 'question',
        name: 'Question Format',
        subject: subject.endsWith('?') ? subject : `${subject}?`,
        content: htmlContent,
        expectedPerformance: 115,
        confidence: 75
      },
      {
        id: 'urgency',
        name: 'Urgency Focus',
        subject: `Limited Time: ${subject}`,
        content: htmlContent,
        expectedPerformance: 135,
        confidence: 70
      }
    ];

    setAbTestVariants(variants);
  };

  const generateSendTimeOptimization = () => {
    const optimizations: SendTimeOptimization[] = [
      {
        timezone: 'EST',
        optimalTime: '10:00 AM Tuesday',
        openRatePrediction: 28.5,
        clickRatePrediction: 4.2,
        confidence: 87,
        reasoning: 'Based on B2B engagement patterns and industry benchmarks'
      },
      {
        timezone: 'PST',
        optimalTime: '2:00 PM Wednesday',
        openRatePrediction: 32.1,
        clickRatePrediction: 5.1,
        confidence: 82,
        reasoning: 'Afternoon sends perform well for West Coast audiences'
      }
    ];

    setSendTimeOptimization(optimizations[0]);
  };

  const generatePerformancePrediction = () => {
    const prediction: PerformancePrediction = {
      openRate: 24.5 + Math.random() * 10,
      clickRate: 3.2 + Math.random() * 3,
      conversionRate: 1.8 + Math.random() * 2,
      unsubscribeRate: 0.5 + Math.random() * 0.5,
      spamComplaintRate: 0.1 + Math.random() * 0.2,
      estimatedROI: 180 + Math.random() * 100,
      confidence: 75 + Math.random() * 20
    };

    setPerformancePrediction(prediction);
  };

  // Utility functions
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <FireIcon className="w-4 h-4 text-red-600" />;
      case 'error': return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      case 'improvement': return <LightBulbIcon className="w-4 h-4 text-blue-500" />;
      case 'optimization': return <SparklesIcon className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical': return <Badge variant="destructive" className="bg-red-600"><FireIcon className="w-3 h-3 mr-1" />Critical</Badge>;
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low': return <Badge variant="outline">Low Impact</Badge>;
      default: return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <TooltipProvider>
      <PageShell
        title="AI Email Optimizer"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <RocketLaunchIcon className="w-4 h-4" />
          </span>
        }
        subtitle="Enterprise-grade email optimization platform with AI-powered insights and advanced analytics"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'AI Tools', href: '/ai' },
          { label: 'Email Optimizer' }
        ]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <BeakerIcon className="w-4 h-4 mr-2" />
              A/B Test
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline" size="sm">
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Analytics
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline" size="sm">
              <PuzzlePieceIcon className="w-4 h-4 mr-2" />
              Integrations
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
            <TabsList className="grid w-full grid-cols-9 h-12">
              <TabsTrigger value="wizard" className="text-xs">
                <CogIcon className="w-4 h-4 mr-1" />
                Wizard
              </TabsTrigger>
              <TabsTrigger value="analyze" className="text-xs">
                <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                Analyze
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs">
                <ChartBarIcon className="w-4 h-4 mr-1" />
                Results {analysis && `(${analysis.overallScore}%)`}
              </TabsTrigger>
              <TabsTrigger value="abtest" className="text-xs">
                <BeakerIcon className="w-4 h-4 mr-1" />
                A/B Test
              </TabsTrigger>
              <TabsTrigger value="timing" className="text-xs">
                <ClockIcon className="w-4 h-4 mr-1" />
                Timing
              </TabsTrigger>
              <TabsTrigger value="segments" className="text-xs">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                Audience
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">
                <TrophyIcon className="w-4 h-4 mr-1" />
                Prediction
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <ClockIcon className="w-4 h-4 mr-1" />
                History
              </TabsTrigger>
              <TabsTrigger value="integrations" className="text-xs">
                <PuzzlePieceIcon className="w-4 h-4 mr-1" />
                Connect
              </TabsTrigger>
            </TabsList>

            {/* Multi-step Optimization Wizard */}
            <TabsContent value="wizard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CogIcon className="w-5 h-5 text-blue-500" />
                    Email Optimization Wizard
                    <Badge variant="outline">Step {wizardStep} of 5</Badge>
                  </CardTitle>
                  <Progress value={(wizardStep / 5) * 100} className="h-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Campaign Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Campaign Type</Label>
                          <Select value={wizardData.campaignType} onValueChange={(value) => 
                            setWizardData(prev => ({ ...prev, campaignType: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newsletter">Newsletter</SelectItem>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="transactional">Transactional</SelectItem>
                              <SelectItem value="welcome">Welcome Series</SelectItem>
                              <SelectItem value="re-engagement">Re-engagement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Primary Goal</Label>
                          <Select value={wizardData.goal} onValueChange={(value) => 
                            setWizardData(prev => ({ ...prev, goal: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary goal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="awareness">Brand Awareness</SelectItem>
                              <SelectItem value="engagement">Increase Engagement</SelectItem>
                              <SelectItem value="conversion">Drive Conversions</SelectItem>
                              <SelectItem value="retention">Customer Retention</SelectItem>
                              <SelectItem value="upsell">Upsell/Cross-sell</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Target Audience</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Audience Segment</Label>
                          <Select value={wizardData.audience} onValueChange={(value) => 
                            setWizardData(prev => ({ ...prev, audience: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new-subscribers">New Subscribers</SelectItem>
                              <SelectItem value="active-customers">Active Customers</SelectItem>
                              <SelectItem value="vip-customers">VIP Customers</SelectItem>
                              <SelectItem value="inactive-users">Inactive Users</SelectItem>
                              <SelectItem value="prospects">Prospects</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Expected List Size</Label>
                          <Input type="number" placeholder="Enter subscriber count" />
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Timeline & Budget</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Launch Timeline</Label>
                          <Select value={wizardData.timeline} onValueChange={(value) => 
                            setWizardData(prev => ({ ...prev, timeline: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Send Immediately</SelectItem>
                              <SelectItem value="today">Later Today</SelectItem>
                              <SelectItem value="tomorrow">Tomorrow</SelectItem>
                              <SelectItem value="this-week">This Week</SelectItem>
                              <SelectItem value="next-week">Next Week</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Budget Range</Label>
                          <div className="space-y-2">
                            <Slider
                              value={[wizardData.budget]}
                              onValueChange={([value]) => setWizardData(prev => ({ ...prev, budget: value }))}
                              max={10000}
                              min={100}
                              step={100}
                              className="w-full"
                            />
                            <div className="text-sm text-muted-foreground">
                              ${wizardData.budget.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Optimization Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Enable A/B Testing</Label>
                            <p className="text-sm text-muted-foreground">
                              Test multiple subject lines and content variations
                            </p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Send Time Optimization</Label>
                            <p className="text-sm text-muted-foreground">
                              AI-powered optimal send time prediction
                            </p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Advanced Personalization</Label>
                            <p className="text-sm text-muted-foreground">
                              Dynamic content based on user behavior
                            </p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 5 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Review & Launch</h3>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <h4 className="font-medium">Configuration Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Campaign Type: {wizardData.campaignType || 'Not set'}</div>
                          <div>Goal: {wizardData.goal || 'Not set'}</div>
                          <div>Audience: {wizardData.audience || 'Not set'}</div>
                          <div>Timeline: {wizardData.timeline || 'Not set'}</div>
                          <div>Budget: ${wizardData.budget.toLocaleString()}</div>
                        </div>
                      </div>
                      <Alert>
                        <RocketLaunchIcon className="h-4 w-4" />
                        <AlertTitle>Ready to Optimize!</AlertTitle>
                        <AlertDescription>
                          Your email optimization strategy is configured. Click "Launch Optimization" to begin.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                      disabled={wizardStep === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={() => {
                        if (wizardStep === 5) {
                          setActiveTab('analyze');
                          toast.success?.('Wizard completed! Ready to analyze your email.');
                        } else {
                          setWizardStep(wizardStep + 1);
                        }
                      }}
                    >
                      {wizardStep === 5 ? (
                        <>
                          <RocketLaunchIcon className="w-4 h-4 mr-2" />
                          Launch Optimization
                        </>
                      ) : (
                        <>
                          Next
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Email Analysis Tab */}
            <TabsContent value="analyze" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                        Email Content Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject Line</Label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Enter your email subject line..."
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{subject.length}/50 characters (optimal: 30-50)</span>
                          <span className={subject.length > 50 ? 'text-red-500' : subject.length < 30 ? 'text-yellow-500' : 'text-green-500'}>
                            {subject.length > 50 ? 'Too long' : subject.length < 30 ? 'Could be longer' : 'Good length'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="html-content">HTML Content</Label>
                        <Textarea
                          id="html-content"
                          value={htmlContent}
                          onChange={(e) => setHtmlContent(e.target.value)}
                          placeholder="Paste your HTML email content here..."
                          className="min-h-48 font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text-content">Plain Text Content (Optional)</Label>
                        <Textarea
                          id="text-content"
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Plain text version of your email..."
                          className="min-h-24"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Optimization Goal</Label>
                          <Select value={optimizationGoal} onValueChange={setOptimizationGoal}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="engagement">Maximize Engagement</SelectItem>
                              <SelectItem value="deliverability">Improve Deliverability</SelectItem>
                              <SelectItem value="conversion">Drive Conversions</SelectItem>
                              <SelectItem value="accessibility">Enhance Accessibility</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Target Timezone</Label>
                          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="EST">Eastern Time</SelectItem>
                              <SelectItem value="PST">Pacific Time</SelectItem>
                              <SelectItem value="CST">Central Time</SelectItem>
                              <SelectItem value="MST">Mountain Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={analyzeEmail} disabled={loading} className="w-full" size="lg">
                        {loading ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            {realTimeFeedback || 'Analyzing Email...'}
                          </>
                        ) : (
                          <>
                            <CpuChipIcon className="w-4 h-4 mr-2" />
                            Run Advanced Analysis
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Quick Checks Panel */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MagnifyingGlassIcon className="w-5 h-5 text-green-500" />
                        Real-time Checks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Subject Line</span>
                        {subject ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">HTML Content</span>
                        {htmlContent ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Plain Text Version</span>
                        {textContent ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Unsubscribe Link</span>
                        {htmlContent.includes('unsubscribe') || htmlContent.includes('{{UNSUBSCRIBE}}') ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Personalization</span>
                        {(subject + htmlContent).includes('{{') ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Call-to-Action</span>
                        {htmlContent.toLowerCase().includes('button') || htmlContent.toLowerCase().includes('cta') ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <StarIcon className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span>Personalized emails can increase engagement by up to 41%</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <DevicePhoneMobileIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>70% of emails are opened on mobile devices - optimize accordingly</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ClockIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Tuesday-Thursday 10am-2pm shows highest engagement rates</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AccessibilityIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                        <span>Include alt text for images to improve accessibility compliance</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {!analysis ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CpuChipIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Results Yet</h3>
                    <p className="text-muted-foreground mb-4">Run the email analysis to see comprehensive optimization insights</p>
                    <Button onClick={() => setActiveTab('analyze')}>
                      <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                      Start Analysis
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Overall Score with detailed breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Overall Email Score</span>
                          <Badge variant="outline" className="text-xs">
                            Processed in {analysis.processingTime}ms
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className={`text-7xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                              {analysis.overallScore}
                            </div>
                            <div className="absolute -bottom-2 left-0 right-0 text-center">
                              <div className="text-lg font-medium text-muted-foreground">/ 100</div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <Progress value={analysis.overallScore} className="h-6" />
                            <div className="text-lg font-medium">
                              {analysis.overallScore >= 90 ? 'Exceptional' :
                               analysis.overallScore >= 80 ? 'Excellent' : 
                               analysis.overallScore >= 70 ? 'Good' :
                               analysis.overallScore >= 60 ? 'Fair' : 'Needs Improvement'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Based on {analysis.results.length} optimization points analyzed
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                          ROI Prediction
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-500 mb-2">
                            {analysis.roiPrediction}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Expected return on investment
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <Card className={getScoreBackground(analysis.subjectScore)}>
                      <CardContent className="p-4 text-center">
                        <EnvelopeIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.subjectScore)}`}>
                          {analysis.subjectScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Subject</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.contentScore)}>
                      <CardContent className="p-4 text-center">
                        <DocumentTextIcon className="w-6 h-6 mx-auto mb-2 text-green-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.contentScore)}`}>
                          {analysis.contentScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Content</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.deliverabilityScore)}>
                      <CardContent className="p-4 text-center">
                        <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.deliverabilityScore)}`}>
                          {analysis.deliverabilityScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Delivery</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.engagementScore)}>
                      <CardContent className="p-4 text-center">
                        <HeartIcon className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.engagementScore)}`}>
                          {analysis.engagementScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Engage</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.spamScore)}>
                      <CardContent className="p-4 text-center">
                        <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2 text-red-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.spamScore)}`}>
                          {analysis.spamScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Spam</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.accessibilityScore)}>
                      <CardContent className="p-4 text-center">
                        <AccessibilityIcon className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.accessibilityScore)}`}>
                          {analysis.accessibilityScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Access</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.mobileScore)}>
                      <CardContent className="p-4 text-center">
                        <DevicePhoneMobileIcon className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.mobileScore)}`}>
                          {analysis.mobileScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Mobile</div>
                      </CardContent>
                    </Card>
                    <Card className={getScoreBackground(analysis.personalizationScore)}>
                      <CardContent className="p-4 text-center">
                        <SparklesIcon className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.personalizationScore)}`}>
                          {analysis.personalizationScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Personal</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Optimization Issues */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Optimization Opportunities ({analysis.results.length})</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setBeforeAfterComparison(!beforeAfterComparison)}>
                            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                            Compare
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.results.length === 0 ? (
                        <div className="text-center py-8">
                          <TrophyIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                          <h3 className="text-lg font-semibold mb-2">Perfect Score!</h3>
                          <p className="text-muted-foreground">No optimization issues found. Your email is ready to perform.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {analysis.results.map((result, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              {getTypeIcon(result.type)}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{result.title}</h4>
                                  <div className="flex items-center gap-2">
                                    {getImpactBadge(result.impact)}
                                    {result.confidence && (
                                      <Badge variant="outline" className="text-xs">
                                        {result.confidence}% confident
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {result.description}
                                </p>
                                {result.fix && (
                                  <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-blue-500">
                                    <strong className="text-blue-700 dark:text-blue-300">Solution:</strong>{' '}
                                    <span className="text-blue-600 dark:text-blue-400">{result.fix}</span>
                                  </div>
                                )}
                                {result.score && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">Quality Score:</span>
                                    <Badge className={getScoreBackground(result.score)}>
                                      {result.score}%
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Advanced Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-blue-500" />
                        AI-Powered Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                            <LightBulbIcon className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* A/B Testing Tab */}
            <TabsContent value="abtest" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BeakerIcon className="w-5 h-5 text-purple-500" />
                    A/B Test Variants
                    <ProBadge />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {abTestVariants.length === 0 ? (
                    <div className="text-center py-8">
                      <BeakerIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No A/B Test Variants</h3>
                      <p className="text-muted-foreground mb-4">Analyze your email first to generate test variants</p>
                      <Button onClick={() => setActiveTab('analyze')}>
                        <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                        Run Analysis
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {abTestVariants.map((variant) => (
                          <Card key={variant.id} className="border-2">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between text-base">
                                <span>{variant.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={variant.id === 'original' ? 'default' : 'secondary'}>
                                    {variant.expectedPerformance}% performance
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {variant.confidence}% confidence
                                  </Badge>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Subject Line</Label>
                                <div className="text-sm font-medium">{variant.subject}</div>
                              </div>
                              <div className="relative">
                                <div className="bg-muted p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                                  {variant.content.substring(0, 200)}
                                  {variant.content.length > 200 && '...'}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1">
                                  <PlayIcon className="w-4 h-4 mr-2" />
                                  Test This Variant
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <EyeIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Test Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Split Percentage</Label>
                            <Select defaultValue="50-50">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="50-50">50/50 Split</SelectItem>
                                <SelectItem value="70-30">70/30 Split</SelectItem>
                                <SelectItem value="80-20">80/20 Split</SelectItem>
                                <SelectItem value="90-10">90/10 Split</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Test Duration</Label>
                            <Select defaultValue="24h">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1h">1 Hour</SelectItem>
                                <SelectItem value="6h">6 Hours</SelectItem>
                                <SelectItem value="12h">12 Hours</SelectItem>
                                <SelectItem value="24h">24 Hours</SelectItem>
                                <SelectItem value="48h">48 Hours</SelectItem>
                                <SelectItem value="7d">1 Week</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Success Metric</Label>
                            <Select defaultValue="open-rate">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open-rate">Open Rate</SelectItem>
                                <SelectItem value="click-rate">Click Rate</SelectItem>
                                <SelectItem value="conversion">Conversion Rate</SelectItem>
                                <SelectItem value="revenue">Revenue</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button className="w-full" size="lg">
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Launch A/B Test
                          <ProBadge className="ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Send Time Optimization Tab */}
            <TabsContent value="timing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-blue-500" />
                      Optimal Send Time Analysis
                      <ProBadge />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sendTimeOptimization ? (
                      <>
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-green-700 dark:text-green-300">Recommended Send Time</span>
                          </div>
                          <div className="text-2xl font-bold mb-2">{sendTimeOptimization.optimalTime}</div>
                          <div className="text-sm text-muted-foreground">{sendTimeOptimization.timezone}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-500">
                              {sendTimeOptimization.openRatePrediction.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Predicted Open Rate</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-500">
                              {sendTimeOptimization.clickRatePrediction.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Predicted Click Rate</div>
                          </div>
                        </div>

                        <Alert>
                          <LightBulbIcon className="h-4 w-4" />
                          <AlertTitle>AI Insight</AlertTitle>
                          <AlertDescription className="text-sm">
                            {sendTimeOptimization.reasoning}
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label>Confidence Level</Label>
                          <Progress value={sendTimeOptimization.confidence} className="h-2" />
                          <div className="text-sm text-muted-foreground text-right">
                            {sendTimeOptimization.confidence}% confident
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <ClockIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Run email analysis to get send time recommendations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GlobeAltIcon className="w-5 h-5 text-green-500" />
                      Timezone Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Audience Timezone</Label>
                      <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC - Coordinated Universal Time</SelectItem>
                          <SelectItem value="EST">EST - Eastern Standard Time</SelectItem>
                          <SelectItem value="PST">PST - Pacific Standard Time</SelectItem>
                          <SelectItem value="CST">CST - Central Standard Time</SelectItem>
                          <SelectItem value="MST">MST - Mountain Standard Time</SelectItem>
                          <SelectItem value="GMT">GMT - Greenwich Mean Time</SelectItem>
                          <SelectItem value="CET">CET - Central European Time</SelectItem>
                          <SelectItem value="JST">JST - Japan Standard Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Best Performing Times by Day</Label>
                      <div className="space-y-2">
                        {[
                          { day: 'Monday', time: '10:00 AM', rate: '23.5%' },
                          { day: 'Tuesday', time: '2:00 PM', rate: '28.2%' },
                          { day: 'Wednesday', time: '11:00 AM', rate: '26.8%' },
                          { day: 'Thursday', time: '1:00 PM', rate: '25.1%' },
                          { day: 'Friday', time: '9:00 AM', rate: '21.3%' }
                        ].map((item) => (
                          <div key={item.day} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.day}</span>
                              <span className="text-sm text-muted-foreground">{item.time}</span>
                            </div>
                            <Badge variant="outline">{item.rate}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule Send
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-purple-500" />
                    Global Send Time Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/20 dark:to-blue-950/20 p-6 rounded-lg">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Worldwide Engagement Patterns</h3>
                      <p className="text-sm text-muted-foreground">Based on historical data from similar campaigns</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-white dark:bg-card rounded border">
                        <div className="text-lg font-bold text-blue-500">82%</div>
                        <div className="text-xs text-muted-foreground">North America</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-card rounded border">
                        <div className="text-lg font-bold text-green-500">76%</div>
                        <div className="text-xs text-muted-foreground">Europe</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-card rounded border">
                        <div className="text-lg font-bold text-yellow-500">68%</div>
                        <div className="text-xs text-muted-foreground">Asia Pacific</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-card rounded border">
                        <div className="text-lg font-bold text-purple-500">71%</div>
                        <div className="text-xs text-muted-foreground">Other Regions</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audience Segmentation Tab */}
            <TabsContent value="segments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-green-500" />
                    Audience Segmentation Analysis
                    <ProBadge />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {audienceSegments.map((segment) => (
                        <Card key={segment.id} className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>{segment.name}</span>
                              <Badge className={getScoreBackground(segment.engagementScore)}>
                                {segment.engagementScore}%
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <UserGroupIcon className="w-4 h-4 text-muted-foreground" />
                              <span>{segment.size.toLocaleString()} subscribers</span>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Characteristics</Label>
                              <div className="flex flex-wrap gap-1">
                                {segment.characteristics.map((char, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {char}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Recommended Approach</Label>
                              <p className="text-sm">{segment.recommendedApproach}</p>
                            </div>

                            <Button size="sm" className="w-full" variant="outline">
                              <MegaphoneIcon className="w-4 h-4 mr-2" />
                              Create Campaign
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Advanced Segmentation Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <ChartPieIcon className="w-4 h-4 text-blue-500" />
                              Behavioral Segments
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">High Openers</span>
                              <Badge variant="outline">1,250</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Frequent Clickers</span>
                              <Badge variant="outline">890</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Recent Purchasers</span>
                              <Badge variant="outline">430</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Cart Abandoners</span>
                              <Badge variant="outline">720</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapIcon className="w-4 h-4 text-green-500" />
                              Geographic Segments
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">North America</span>
                              <Badge variant="outline">2,100</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Europe</span>
                              <Badge variant="outline">1,500</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Asia Pacific</span>
                              <Badge variant="outline">850</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Other</span>
                              <Badge variant="outline">350</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Prediction Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-yellow-500" />
                      Performance Prediction
                      <ProBadge />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {performancePrediction ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-500">
                              {performancePrediction.openRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Open Rate</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-500">
                              {performancePrediction.clickRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Click Rate</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-purple-500">
                              {performancePrediction.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Conversion Rate</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-red-500">
                              {performancePrediction.unsubscribeRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Unsubscribe Rate</div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Estimated ROI</span>
                            <span className="text-2xl font-bold text-green-500">
                              {performancePrediction.estimatedROI.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={Math.min(100, performancePrediction.estimatedROI / 3)} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <Label>Prediction Confidence</Label>
                          <Progress value={performancePrediction.confidence} className="h-2" />
                          <div className="text-sm text-muted-foreground text-right">
                            {performancePrediction.confidence.toFixed(0)}% confident
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <TrophyIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Run email analysis to get performance predictions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PresentationChartLineIcon className="w-5 h-5 text-blue-500" />
                      Industry Benchmarks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Industry Avg. Open Rate</span>
                        <span className="text-sm font-medium">21.3%</span>
                      </div>
                      <Progress value={21.3} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Industry Avg. Click Rate</span>
                        <span className="text-sm font-medium">2.6%</span>
                      </div>
                      <Progress value={26} className="h-2" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Industry Avg. Conversion</span>
                        <span className="text-sm font-medium">1.2%</span>
                      </div>
                      <Progress value={12} className="h-2" />
                    </div>

                    <Separator />

                    <Alert>
                      <StarIcon className="h-4 w-4" />
                      <AlertTitle>Performance Outlook</AlertTitle>
                      <AlertDescription className="text-sm">
                        Your email is predicted to perform{' '}
                        {performancePrediction && performancePrediction.openRate > 21.3 ? 'above' : 'below'} industry average.
                        {performancePrediction && performancePrediction.openRate > 21.3 && ' Great work!'}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                    ROI Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>List Size</Label>
                      <Input type="number" placeholder="10,000" defaultValue="10000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Campaign Cost</Label>
                      <Input type="number" placeholder="500" defaultValue="500" />
                    </div>
                    <div className="space-y-2">
                      <Label>Avg. Order Value</Label>
                      <Input type="number" placeholder="75" defaultValue="75" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Revenue</Label>
                      <Input type="number" placeholder="2,250" defaultValue="2250" readOnly className="bg-muted" />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-500">$2,250</div>
                        <div className="text-xs text-muted-foreground">Projected Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-500">$1,750</div>
                        <div className="text-xs text-muted-foreground">Net Profit</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-500">350%</div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Optimization History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-purple-500" />
                    Optimization History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {optimizationHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                      <p className="text-muted-foreground">Your optimization history will appear here as you analyze emails</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Before</TableHead>
                            <TableHead>After</TableHead>
                            <TableHead>Improvement</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {optimizationHistory.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.emailTitle}</TableCell>
                              <TableCell>{formatDate(record.timestamp)}</TableCell>
                              <TableCell>
                                <Badge className={getScoreBackground(record.beforeScore)}>
                                  {record.beforeScore}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getScoreBackground(record.afterScore)}>
                                  {record.afterScore}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-green-600">
                                  +{record.afterScore - record.beforeScore}%
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  record.status === 'completed' ? 'default' :
                                  record.status === 'implemented' ? 'secondary' : 'outline'
                                }>
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost">
                                    <EyeIcon className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-500">
                              {optimizationHistory.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Optimizations</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-500">
                              +{Math.round(optimizationHistory.reduce((acc, curr) => acc + (curr.afterScore - curr.beforeScore), 0) / optimizationHistory.length)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Avg. Improvement</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-500">
                              {optimizationHistory.filter(h => h.status === 'implemented').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Implemented</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ESP Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PuzzlePieceIcon className="w-5 h-5 text-blue-500" />
                    Email Service Provider Integrations
                    <ProBadge />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {espIntegrations.map((integration, index) => (
                        <Card key={index} className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>{integration.provider}</span>
                              <Badge variant={
                                integration.status === 'connected' ? 'default' :
                                integration.status === 'error' ? 'destructive' : 'outline'
                              }>
                                {integration.status}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Capabilities</Label>
                              <div className="flex flex-wrap gap-1">
                                {integration.capabilities.map((capability, capIndex) => (
                                  <Badge key={capIndex} variant="outline" className="text-xs">
                                    {capability}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Last sync: {formatDate(integration.lastSync)}
                            </div>

                            <Button 
                              size="sm" 
                              className="w-full" 
                              variant={integration.status === 'connected' ? 'outline' : 'default'}
                            >
                              {integration.status === 'connected' ? (
                                <>
                                  <CogIcon className="w-4 h-4 mr-2" />
                                  Configure
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-4 h-4 mr-2" />
                                  Connect
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Add New Integration Card */}
                      <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                          <PuzzlePieceIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                          <h3 className="font-medium mb-1">Add Integration</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Connect your email platform
                          </p>
                          <Button size="sm">
                            <PuzzlePieceIcon className="w-4 h-4 mr-2" />
                            Browse Integrations
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Available Integrations</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          'Mailchimp', 'SendGrid', 'Constant Contact', 'Campaign Monitor',
                          'GetResponse', 'ConvertKit', 'ActiveCampaign', 'Klaviyo'
                        ].map((provider) => (
                          <Button key={provider} variant="outline" className="justify-start">
                            <PuzzlePieceIcon className="w-4 h-4 mr-2" />
                            {provider}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Alert>
                      <PuzzlePieceIcon className="h-4 w-4" />
                      <AlertTitle>Enterprise Features</AlertTitle>
                      <AlertDescription>
                        Unlock advanced integrations, automated optimization, and detailed analytics with our Pro plan.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default AIEmailOptimizer;