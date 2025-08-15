import React, { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import PageShell from '../components/PageShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import ProBadge from '@/components/ui/ProBadge';
import { toast } from '@/hooks/useToast';
import {
  SparklesIcon,
  UserIcon,
  CpuChipIcon,
  HeartIcon,
  LightBulbIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  BeakerIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface PersonalizationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  field: string;
  value: string;
  enabled: boolean;
}

interface PersonalizedContent {
  id: string;
  original: string;
  personalized: string;
  variables: Record<string, string>;
  rules: string[];
  engagement_score: number;
}

interface AudienceSegment {
  name: string;
  description: string;
  size: number;
  characteristics: string[];
  preferences: {
    tone: string;
    content_type: string;
    communication_style: string;
  };
}

const AIContentPersonalizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personalizer');
  const [baseContent, setBaseContent] = useState('');
  const [audienceData, setAudienceData] = useState('');
  const [personalizationLevel, setPersonalizationLevel] = useState(7);
  const [useAI, setUseAI] = useState(true);
  const [dynamicInserts, setDynamicInserts] = useState(true);
  const [contextualAdaptation, setContextualAdaptation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [personalizedResults, setPersonalizedResults] = useState<PersonalizedContent[]>([]);
  const [rules, setRules] = useState<PersonalizationRule[]>([]);
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const reduceMotion = useReducedMotion();

  const generatePersonalizedContent = useCallback(async () => {
    if (!baseContent.trim()) {
      toast.error?.('Please provide base content to personalize');
      return;
    }

    setLoading(true);
    try {
      // Simulate AI personalization - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockResults: PersonalizedContent[] = [
        {
          id: '1',
          original: baseContent,
          personalized: generatePersonalizedVariant(baseContent, 'professional', 'B2B Software'),
          variables: { 
            tone: 'professional', 
            industry: 'B2B Software',
            segment: 'Enterprise Decision Makers'
          },
          rules: ['Industry-specific terminology', 'Professional tone', 'ROI-focused messaging'],
          engagement_score: 92
        },
        {
          id: '2',
          original: baseContent,
          personalized: generatePersonalizedVariant(baseContent, 'casual', 'E-commerce'),
          variables: { 
            tone: 'casual', 
            industry: 'E-commerce',
            segment: 'SMB Owners'
          },
          rules: ['Conversational language', 'Growth-focused benefits', 'Quick wins messaging'],
          engagement_score: 88
        },
        {
          id: '3',
          original: baseContent,
          personalized: generatePersonalizedVariant(baseContent, 'urgent', 'Startup'),
          variables: { 
            tone: 'urgent', 
            industry: 'Startup',
            segment: 'Early Adopters'
          },
          rules: ['Time-sensitive language', 'Innovation emphasis', 'Competitive advantage'],
          engagement_score: 85
        }
      ];

      setPersonalizedResults(mockResults);
      toast.success?.(`Generated ${mockResults.length} personalized variants`);
      setActiveTab('results');
    } catch (error) {
      toast.error?.('Failed to generate personalized content');
    } finally {
      setLoading(false);
    }
  }, [baseContent]);

  const generatePersonalizedVariant = (content: string, tone: string, industry: string): string => {
    let personalized = content;

    // Apply tone modifications
    if (tone === 'professional') {
      personalized = personalized
        .replace(/hey/gi, 'Hello')
        .replace(/awesome/gi, 'excellent')
        .replace(/amazing/gi, 'outstanding');
    } else if (tone === 'casual') {
      personalized = personalized
        .replace(/Hello/gi, 'Hey')
        .replace(/excellent/gi, 'awesome')
        .replace(/outstanding/gi, 'amazing');
    } else if (tone === 'urgent') {
      personalized = personalized
        .replace(/you can/gi, 'you must')
        .replace(/consider/gi, 'act now on')
        .replace(/available/gi, 'limited-time available');
    }

    // Apply industry-specific modifications
    if (industry === 'B2B Software') {
      personalized = personalized.replace(/product/gi, 'solution');
      personalized += '\n\nThis enterprise-grade solution integrates seamlessly with your existing tech stack.';
    } else if (industry === 'E-commerce') {
      personalized = personalized.replace(/solution/gi, 'tool');
      personalized += '\n\nBoost your online sales and customer satisfaction with our proven platform.';
    } else if (industry === 'Startup') {
      personalized = personalized.replace(/traditional/gi, 'innovative');
      personalized += '\n\nJoin thousands of startups scaling faster with our cutting-edge technology.';
    }

    return personalized;
  };

  const addPersonalizationRule = useCallback(() => {
    const newRule: PersonalizationRule = {
      id: `rule-${Date.now()}`,
      name: `Rule ${rules.length + 1}`,
      condition: 'industry',
      action: 'replace_text',
      field: 'content',
      value: '',
      enabled: true
    };
    setRules(prev => [...prev, newRule]);
  }, [rules.length]);

  const updateRule = useCallback((id: string, updates: Partial<PersonalizationRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  }, []);

  const deleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  }, []);

  const loadSampleSegments = useCallback(() => {
    const sampleSegments: AudienceSegment[] = [
      {
        name: 'Enterprise Decision Makers',
        description: 'C-level executives and VPs at large corporations',
        size: 1250,
        characteristics: ['High budget authority', 'Risk-averse', 'ROI-focused'],
        preferences: {
          tone: 'professional',
          content_type: 'detailed_analysis',
          communication_style: 'formal'
        }
      },
      {
        name: 'SMB Growth Hackers',
        description: 'Marketing leaders at small-medium businesses',
        size: 3400,
        characteristics: ['Budget-conscious', 'Results-driven', 'Time-sensitive'],
        preferences: {
          tone: 'friendly',
          content_type: 'quick_wins',
          communication_style: 'conversational'
        }
      },
      {
        name: 'Tech Early Adopters',
        description: 'Innovation-focused technology professionals',
        size: 890,
        characteristics: ['Tech-savvy', 'Risk-tolerant', 'Feature-focused'],
        preferences: {
          tone: 'excited',
          content_type: 'feature_deep_dive',
          communication_style: 'technical'
        }
      }
    ];
    setSegments(sampleSegments);
  }, []);

  React.useEffect(() => {
    loadSampleSegments();
  }, [loadSampleSegments]);

  const getEngagementColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEngagementBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (score >= 80) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <TooltipProvider>
      <PageShell
        title="AI Content Personalizer"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <SparklesIcon className="w-4 h-4 text-primary" />
          </span>
        }
        subtitle="AI-powered content personalization for maximum audience engagement"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Tools', href: '/ai' }, { label: 'Personalizer' }]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline">
              <ChartBarIcon className="w-4 h-4 mr-2" /> Analytics
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline">
              <BeakerIcon className="w-4 h-4 mr-2" /> A/B Test
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" /> Settings
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personalizer">Personalizer</TabsTrigger>
              <TabsTrigger value="results">Results ({personalizedResults.length})</TabsTrigger>
              <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
              <TabsTrigger value="segments">Segments ({segments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="personalizer" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Content Input */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PaintBrushIcon className="w-5 h-5 text-blue-500" />
                        Base Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="base-content">Content to Personalize</Label>
                        <Textarea
                          id="base-content"
                          value={baseContent}
                          onChange={(e) => setBaseContent(e.target.value)}
                          placeholder="Enter your base email content here. Use merge tags like {{FIRST_NAME}} and {{COMPANY}} for dynamic personalization..."
                          className="min-h-48"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audience-data">Audience Context (Optional)</Label>
                        <Textarea
                          id="audience-data"
                          value={audienceData}
                          onChange={(e) => setAudienceData(e.target.value)}
                          placeholder="Provide context about your audience: industry, company size, role, interests, pain points..."
                          className="min-h-24"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-500" />
                        Personalization Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Personalization Level: {personalizationLevel}/10</Label>
                        <Slider
                          value={[personalizationLevel]}
                          onValueChange={(value) => setPersonalizationLevel(value[0])}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">
                          {personalizationLevel <= 3 ? 'Light personalization' : 
                           personalizationLevel <= 7 ? 'Moderate personalization' : 
                           'Heavy personalization'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="use-ai">AI Enhancement</Label>
                          <Switch
                            id="use-ai"
                            checked={useAI}
                            onCheckedChange={setUseAI}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="dynamic-inserts">Dynamic Inserts</Label>
                          <Switch
                            id="dynamic-inserts"
                            checked={dynamicInserts}
                            onCheckedChange={setDynamicInserts}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="contextual">Contextual Adaptation</Label>
                          <Switch
                            id="contextual"
                            checked={contextualAdaptation}
                            onCheckedChange={setContextualAdaptation}
                          />
                        </div>
                      </div>

                      <Button onClick={generatePersonalizedContent} disabled={loading} className="w-full" size="lg">
                        {loading ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            Personalizing Content...
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Generate Personalized Variants
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Settings & Features */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-green-500" />
                        Personalization Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Dynamic merge tags</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Industry-specific language</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Tone adaptation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Geographic localization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Behavioral triggers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                        <span>Real-time content adaptation</span>
                        <ProBadge className="ml-auto" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                        Quick Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <HeartIcon className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                        <span>Use {'{FIRST_NAME}'} and {'{COMPANY}'} for basic personalization</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>Include industry context for better targeting</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Consider timing and seasonal relevance</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                        <span>Add location-based customization</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {personalizedResults.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No personalized content yet</p>
                    <p className="text-sm text-muted-foreground">Use the Personalizer tab to generate variants</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {personalizedResults.map((result) => (
                    <Card key={result.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-blue-500" />
                            {result.variables.segment}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getEngagementBadge(result.engagement_score)}>
                              {result.engagement_score}% Engagement
                            </Badge>
                            <Button size="sm" variant="outline">
                              <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Original */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Original Content</Label>
                            <div className="p-3 bg-muted rounded text-sm">
                              {result.original}
                            </div>
                          </div>

                          {/* Personalized */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Personalized Content</Label>
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm">
                              {result.personalized}
                            </div>
                          </div>
                        </div>

                        {/* Variables */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Applied Variables</Label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(result.variables).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Rules Applied */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Applied Rules</Label>
                          <div className="flex flex-wrap gap-2">
                            {result.rules.map((rule, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {rule}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-500" />
                      Personalization Rules
                    </CardTitle>
                    <Button onClick={addPersonalizationRule}>
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {rules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AdjustmentsHorizontalIcon className="w-8 h-8 mx-auto mb-2" />
                      <p>No personalization rules yet</p>
                      <p className="text-sm">Add rules to customize how content is personalized</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rules.map((rule) => (
                        <Card key={rule.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                            <div className="space-y-1">
                              <Label className="text-xs">Rule Name</Label>
                              <Input
                                value={rule.name}
                                onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                                placeholder="Rule name"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Condition</Label>
                              <Select value={rule.condition} onValueChange={(value) => updateRule(rule.id, { condition: value })}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="industry">Industry</SelectItem>
                                  <SelectItem value="company_size">Company Size</SelectItem>
                                  <SelectItem value="role">Job Role</SelectItem>
                                  <SelectItem value="location">Location</SelectItem>
                                  <SelectItem value="engagement">Engagement Level</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Action</Label>
                              <Select value={rule.action} onValueChange={(value) => updateRule(rule.id, { action: value })}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="replace_text">Replace Text</SelectItem>
                                  <SelectItem value="insert_content">Insert Content</SelectItem>
                                  <SelectItem value="change_tone">Change Tone</SelectItem>
                                  <SelectItem value="add_urgency">Add Urgency</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Field</Label>
                              <Select value={rule.field} onValueChange={(value) => updateRule(rule.id, { field: value })}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="subject">Subject</SelectItem>
                                  <SelectItem value="content">Content</SelectItem>
                                  <SelectItem value="cta">Call-to-Action</SelectItem>
                                  <SelectItem value="greeting">Greeting</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Value</Label>
                              <Input
                                value={rule.value}
                                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                                placeholder="Value"
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteRule(rule.id)}
                              >
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="segments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-green-500" />
                    Audience Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map((segment, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{segment.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {segment.size.toLocaleString()} contacts
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {segment.description}
                          </p>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Characteristics</Label>
                            <div className="flex flex-wrap gap-1">
                              {segment.characteristics.map((char, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {char}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Preferences</Label>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                              <div className="flex justify-between">
                                <span>Tone:</span>
                                <span className="capitalize">{segment.preferences.tone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Content:</span>
                                <span className="capitalize">{segment.preferences.content_type.replace('_', ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Style:</span>
                                <span className="capitalize">{segment.preferences.communication_style}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
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

export default AIContentPersonalizer;