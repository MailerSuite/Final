import React, { useState, useCallback } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProBadge from '@/components/ui/ProBadge';
import { toast } from '@/hooks/useToast';
import {
  UserGroupIcon,
  CpuChipIcon,
  ChartBarIcon,
  StarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface LeadData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
  source?: string;
  lastActivity?: string;
}

interface LeadScore {
  leadId: string;
  overallScore: number;
  quality: 'hot' | 'warm' | 'cold' | 'invalid';
  factors: {
    emailQuality: number;
    domainReputation: number;
    companySize: number;
    industryMatch: number;
    engagementHistory: number;
    dataCompleteness: number;
  };
  predictions: {
    conversionProbability: number;
    responseRate: number;
    unsubscribeRisk: number;
    spamRisk: number;
  };
  recommendations: string[];
  insights: string[];
}

interface BulkScoreResult {
  total: number;
  processed: number;
  scores: LeadScore[];
  summary: {
    hot: number;
    warm: number;
    cold: number;
    invalid: number;
  };
}

const AILeadScorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [singleLead, setSingleLead] = useState<LeadData>({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    industry: '',
    location: ''
  });
  const [singleScore, setSingleScore] = useState<LeadScore | null>(null);
  const [bulkLeads, setBulkLeads] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkScoreResult | null>(null);
  const [savedScores, setSavedScores] = useState<LeadScore[]>([]);
  const reduceMotion = useReducedMotion();

  const scoreSingleLead = useCallback(async () => {
    if (!singleLead.email.trim()) {
      toast.error?.('Email address is required');
      return;
    }

    setLoading(true);
    try {
      // Simulate AI scoring - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockScore: LeadScore = generateMockScore(singleLead);
      setSingleScore(mockScore);
      toast.success?.('Lead scoring completed');
      setActiveTab('results');
    } catch (error) {
      toast.error?.('Failed to score lead');
    } finally {
      setLoading(false);
    }
  }, [singleLead]);

  const scoreBulkLeads = useCallback(async () => {
    if (!bulkLeads.trim()) {
      toast.error?.('Please provide lead data');
      return;
    }

    setLoading(true);
    try {
      // Parse CSV or email list
      const lines = bulkLeads.split('\n').filter(line => line.trim());
      const leads: LeadData[] = lines.map((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        return {
          id: `bulk-${index}`,
          email: parts[0] || '',
          firstName: parts[1] || '',
          lastName: parts[2] || '',
          company: parts[3] || '',
          title: parts[4] || ''
        };
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const scores = leads.map(lead => generateMockScore(lead));
      const summary = {
        hot: scores.filter(s => s.quality === 'hot').length,
        warm: scores.filter(s => s.quality === 'warm').length,
        cold: scores.filter(s => s.quality === 'cold').length,
        invalid: scores.filter(s => s.quality === 'invalid').length
      };

      const results: BulkScoreResult = {
        total: leads.length,
        processed: leads.length,
        scores,
        summary
      };

      setBulkResults(results);
      toast.success?.(`Processed ${leads.length} leads`);
      setActiveTab('bulk-results');
    } catch (error) {
      toast.error?.('Failed to process bulk leads');
    } finally {
      setLoading(false);
    }
  }, [bulkLeads]);

  const generateMockScore = (lead: LeadData): LeadScore => {
    const emailScore = validateEmail(lead.email) ? Math.random() * 30 + 70 : Math.random() * 30 + 20;
    const domainScore = lead.email.includes('@gmail.com') || lead.email.includes('@yahoo.com') ? 
      Math.random() * 20 + 60 : Math.random() * 30 + 70;
    const companyScore = lead.company ? Math.random() * 25 + 75 : Math.random() * 40 + 30;
    const industryScore = lead.industry ? Math.random() * 20 + 80 : Math.random() * 30 + 50;
    const engagementScore = Math.random() * 40 + 60;
    const completenessScore = Object.values(lead).filter(v => v && v.trim()).length * 12.5;

    const overallScore = Math.round(
      (emailScore * 0.25 + domainScore * 0.15 + companyScore * 0.2 + 
       industryScore * 0.15 + engagementScore * 0.15 + completenessScore * 0.1)
    );

    let quality: 'hot' | 'warm' | 'cold' | 'invalid';
    if (overallScore >= 80) quality = 'hot';
    else if (overallScore >= 60) quality = 'warm';
    else if (overallScore >= 40) quality = 'cold';
    else quality = 'invalid';

    return {
      leadId: lead.id,
      overallScore,
      quality,
      factors: {
        emailQuality: Math.round(emailScore),
        domainReputation: Math.round(domainScore),
        companySize: Math.round(companyScore),
        industryMatch: Math.round(industryScore),
        engagementHistory: Math.round(engagementScore),
        dataCompleteness: Math.round(completenessScore)
      },
      predictions: {
        conversionProbability: Math.round(Math.random() * 40 + 40),
        responseRate: Math.round(Math.random() * 30 + 50),
        unsubscribeRisk: Math.round(Math.random() * 20 + 5),
        spamRisk: Math.round(Math.random() * 15 + 2)
      },
      recommendations: generateRecommendations(quality, overallScore),
      insights: generateInsights(lead, quality)
    };
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const generateRecommendations = (quality: string, score: number): string[] => {
    const recommendations = [];
    
    if (quality === 'hot') {
      recommendations.push('Priority follow-up recommended within 24 hours');
      recommendations.push('Personalize outreach with company-specific insights');
      recommendations.push('Use direct phone call or LinkedIn connection');
    } else if (quality === 'warm') {
      recommendations.push('Schedule follow-up within 3-5 days');
      recommendations.push('Send targeted content relevant to their industry');
      recommendations.push('Consider email nurture sequence');
    } else if (quality === 'cold') {
      recommendations.push('Include in general nurture campaign');
      recommendations.push('Focus on educational content');
      recommendations.push('Monitor for engagement before direct outreach');
    } else {
      recommendations.push('Verify email address and contact information');
      recommendations.push('Consider removing from active campaigns');
      recommendations.push('Look for alternative contact methods');
    }

    return recommendations;
  };

  const generateInsights = (lead: LeadData, quality: string): string[] => {
    const insights = [];
    
    if (lead.company) {
      insights.push(`Company domain analysis suggests ${quality} potential`);
    }
    if (lead.title) {
      insights.push(`Job title indicates decision-making authority`);
    }
    if (lead.industry) {
      insights.push(`Industry alignment with target market detected`);
    }
    
    insights.push(`Email deliverability score: ${quality === 'hot' ? 'High' : quality === 'warm' ? 'Medium' : 'Low'}`);
    
    return insights;
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'hot':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">🔥 Hot Lead</Badge>;
      case 'warm':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">⚡ Warm Lead</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">❄️ Cold Lead</Badge>;
      case 'invalid':
        return <Badge className="bg-muted/10 text-muted-foreground border-border/20">❌ Invalid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-blue-500';
    return 'text-muted-foreground';
  };

  const saveLead = useCallback((score: LeadScore) => {
    setSavedScores(prev => [...prev.filter(s => s.leadId !== score.leadId), score]);
    toast.success?.('Lead saved to list');
  }, []);

  return (
    <TooltipProvider>
      <PageShell
        title="AI Lead Scorer"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <UserGroupIcon className="w-4 h-4 text-primary" />
          </span>
        }
        subtitle="AI-powered lead quality assessment and scoring for better targeting"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'AI Tools', href: '/ai' }, { label: 'Lead Scorer' }]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline">
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> Import CSV
            </Button>
            <Button variant="outline">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export Results
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline">
              <ChartBarIcon className="w-4 h-4 mr-2" /> Analytics
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="single">Single Lead</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Scoring</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="bulk-results">Bulk Results</TabsTrigger>
              <TabsTrigger value="saved">Saved ({savedScores.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Input Form */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-blue-500" />
                        Lead Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={singleLead.email}
                            onChange={(e) => setSingleLead(prev => ({...prev, email: e.target.value}))}
                            placeholder="john@company.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={singleLead.company || ''}
                            onChange={(e) => setSingleLead(prev => ({...prev, company: e.target.value}))}
                            placeholder="Acme Inc."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={singleLead.firstName || ''}
                            onChange={(e) => setSingleLead(prev => ({...prev, firstName: e.target.value}))}
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={singleLead.lastName || ''}
                            onChange={(e) => setSingleLead(prev => ({...prev, lastName: e.target.value}))}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Job Title</Label>
                          <Input
                            id="title"
                            value={singleLead.title || ''}
                            onChange={(e) => setSingleLead(prev => ({...prev, title: e.target.value}))}
                            placeholder="Marketing Manager"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Select value={singleLead.industry || ''} onValueChange={(value) => setSingleLead(prev => ({...prev, industry: value}))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={singleLead.location || ''}
                          onChange={(e) => setSingleLead(prev => ({...prev, location: e.target.value}))}
                          placeholder="New York, NY"
                        />
                      </div>

                      <Button onClick={scoreSingleLead} disabled={loading} className="w-full" size="lg">
                        {loading ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            Scoring Lead...
                          </>
                        ) : (
                          <>
                            <CpuChipIcon className="w-4 h-4 mr-2" />
                            Score This Lead
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Scoring Factors */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        Scoring Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-blue-500" />
                        <span>Email Quality & Validity</span>
                        <Badge variant="outline" className="ml-auto">25%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                        <span>Domain Reputation</span>
                        <Badge variant="outline" className="ml-auto">15%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-purple-500" />
                        <span>Company Profile</span>
                        <Badge variant="outline" className="ml-auto">20%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <BoltIcon className="w-4 h-4 text-orange-500" />
                        <span>Industry Match</span>
                        <Badge variant="outline" className="ml-auto">15%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4 text-cyan-500" />
                        <span>Engagement History</span>
                        <Badge variant="outline" className="ml-auto">15%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-pink-500" />
                        <span>Data Completeness</span>
                        <Badge variant="outline" className="ml-auto">10%</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-blue-500" />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Complete profiles get higher scores</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrophyIcon className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span>Corporate emails rank higher than personal</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <BoltIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>Industry alignment boosts relevance</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-green-500" />
                    Bulk Lead Scoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-leads">Lead Data (CSV Format)</Label>
                    <Textarea
                      id="bulk-leads"
                      value={bulkLeads}
                      onChange={(e) => setBulkLeads(e.target.value)}
                      placeholder={`Paste your lead data here (CSV format):
email@company.com, John, Doe, Acme Inc, Manager
jane@startup.com, Jane, Smith, Tech Corp, Director
...`}
                      className="min-h-48 font-mono text-sm"
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Format:</strong> email, first_name, last_name, company, title (one per line)
                  </div>

                  <Button onClick={scoreBulkLeads} disabled={loading} className="w-full" size="lg">
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Processing Leads...
                      </>
                    ) : (
                      <>
                        <CpuChipIcon className="w-4 h-4 mr-2" />
                        Score All Leads
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {!singleScore ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No lead scored yet</p>
                    <p className="text-sm text-muted-foreground">Use the Single Lead tab to score a lead</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Overall Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Lead Score Results
                        <Button onClick={() => saveLead(singleScore)} size="sm" variant="outline">
                          <StarIcon className="w-4 h-4 mr-2" />
                          Save Lead
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <div className={`text-6xl font-bold ${getScoreColor(singleScore.overallScore)}`}>
                          {singleScore.overallScore}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getQualityBadge(singleScore.quality)}
                          </div>
                          <Progress value={singleScore.overallScore} className="h-4" />
                          <div className="text-sm text-muted-foreground">
                            Overall lead quality score out of 100
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Scoring Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(singleScore.factors).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className={`font-bold ${getScoreColor(value)}`}>{value}</span>
                            </div>
                            <Progress value={value} className="h-2" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>AI Predictions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="text-2xl font-bold text-green-500">
                              {singleScore.predictions.conversionProbability}%
                            </div>
                            <div className="text-xs text-muted-foreground">Conversion</div>
                          </div>
                          <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="text-2xl font-bold text-blue-500">
                              {singleScore.predictions.responseRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">Response Rate</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <div className="text-2xl font-bold text-yellow-500">
                              {singleScore.predictions.unsubscribeRisk}%
                            </div>
                            <div className="text-xs text-muted-foreground">Unsubscribe Risk</div>
                          </div>
                          <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="text-2xl font-bold text-red-500">
                              {singleScore.predictions.spamRisk}%
                            </div>
                            <div className="text-xs text-muted-foreground">Spam Risk</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations & Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BoltIcon className="w-5 h-5 text-orange-500" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {singleScore.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-blue-500" />
                          AI Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {singleScore.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <SparklesIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="bulk-results" className="space-y-6">
              {!bulkResults ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No bulk results yet</p>
                    <p className="text-sm text-muted-foreground">Use the Bulk Scoring tab to process multiple leads</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{bulkResults.processed}</div>
                        <div className="text-sm text-muted-foreground">Processed</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-500">{bulkResults.summary.hot}</div>
                        <div className="text-sm text-muted-foreground">Hot Leads</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-500">{bulkResults.summary.warm}</div>
                        <div className="text-sm text-muted-foreground">Warm Leads</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-500/10 border-blue-500/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{bulkResults.summary.cold}</div>
                        <div className="text-sm text-muted-foreground">Cold Leads</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/10 border-border/20">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-muted-foreground">{bulkResults.summary.invalid}</div>
                        <div className="text-sm text-muted-foreground">Invalid</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Results Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Quality</TableHead>
                            <TableHead>Conversion %</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkResults.scores.slice(0, 10).map((score, index) => {
                            const email = bulkLeads.split('\n')[index]?.split(',')[0]?.trim() || 'Unknown';
                            return (
                              <TableRow key={score.leadId}>
                                <TableCell className="font-mono text-sm">{email}</TableCell>
                                <TableCell>
                                  <div className={`font-bold ${getScoreColor(score.overallScore)}`}>
                                    {score.overallScore}
                                  </div>
                                </TableCell>
                                <TableCell>{getQualityBadge(score.quality)}</TableCell>
                                <TableCell>{score.predictions.conversionProbability}%</TableCell>
                                <TableCell>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => saveLead(score)}
                                  >
                                    <StarIcon className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Leads ({savedScores.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedScores.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <StarIcon className="w-8 h-8 mx-auto mb-2" />
                      <p>No saved leads yet</p>
                      <p className="text-sm">Star leads from results to save them here</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead ID</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Quality</TableHead>
                          <TableHead>Conversion %</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {savedScores.map((score) => (
                          <TableRow key={score.leadId}>
                            <TableCell className="font-mono">{score.leadId}</TableCell>
                            <TableCell>
                              <div className={`font-bold ${getScoreColor(score.overallScore)}`}>
                                {score.overallScore}
                              </div>
                            </TableCell>
                            <TableCell>{getQualityBadge(score.quality)}</TableCell>
                            <TableCell>{score.predictions.conversionProbability}%</TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSavedScores(prev => prev.filter(s => s.leadId !== score.leadId))}
                              >
                                <StarIconSolid className="w-4 h-4 text-yellow-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </PageShell>
    </TooltipProvider>
  );
};

export default AILeadScorer;