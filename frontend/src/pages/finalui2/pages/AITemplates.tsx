import React, { useMemo, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Error presentation moved to stable API client
// For now, using simple error handling
const presentErrorToUser = (error: unknown) => console.error('Error:', error);
import { Alert, AlertDescription } from '@/components/ui/alert';
import TemplateOptionsPanel, { TemplateOptions, defaultOptions } from '@/components/TemplateOptionsPanel';
import { randomizeContent, validatePlaceholders } from '@/utils/htmlRandomizer';
import axios from '@/http/axios';
import { listTemplates as apiListTemplates, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, duplicateTemplate as apiDuplicateTemplate } from '@/api/templates'
import { toast } from '@/hooks/useToast';
import ProBadge from '@/components/ui/ProBadge';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  FolderIcon,
  StarIcon,
  CpuChipIcon,
  BeakerIcon,
  RocketLaunchIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  Cog6ToothIcon,
  CodeBracketIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type TemplateMeta = {
  id: string;
  name: string;
  category: 'marketing' | 'newsletter' | 'transactional' | 'welcome' | 'product' | 'announcement' | 'crypto' | 'fintech' | 'logistics' | 'commerce';
  updatedAt: string;
  aiScore: number;
  thumbnail: string;
  tags: string[];
  favorite?: boolean;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
};

const demoTemplates: TemplateMeta[] = [
  { id: 'tpl-hero', name: 'Hero Spotlight', category: 'marketing', updatedAt: '2d ago', aiScore: 92, thumbnail: 'gradient:linear-gradient(135deg,#0ea5e9 0%,#1e3a8a 100%)', tags: ['hero', 'cta', 'promo'], favorite: true },
  { id: 'tpl-news', name: 'Weekly Digest', category: 'newsletter', updatedAt: '5d ago', aiScore: 88, thumbnail: 'gradient:linear-gradient(135deg,#3b82f6 0%,#0ea5e9 100%)', tags: ['newsletter', 'digest'] },
  { id: 'tpl-trans', name: 'Receipt Classic', category: 'transactional', updatedAt: '1d ago', aiScore: 95, thumbnail: 'gradient:linear-gradient(135deg,#111827 0%,#0ea5e9 100%)', tags: ['transactional', 'receipt'] },
  { id: 'tpl-welcome', name: 'Welcome Flow', category: 'welcome', updatedAt: '3h ago', aiScore: 90, thumbnail: 'gradient:linear-gradient(135deg,#8b5cf6 0%,#0ea5e9 100%)', tags: ['welcome', 'onboarding'], favorite: true },
  { id: 'tpl-prod', name: 'Product Feature', category: 'product', updatedAt: '7h ago', aiScore: 87, thumbnail: 'gradient:linear-gradient(135deg,#22d3ee 0%,#3b82f6 100%)', tags: ['product', 'feature'] },
  { id: 'tpl-announce', name: 'Announcement Pro', category: 'announcement', updatedAt: '9d ago', aiScore: 84, thumbnail: 'gradient:linear-gradient(135deg,#0ea5e9 0%,#1e3a8a 100%)', tags: ['announcement'] },
];

interface TemplateEditor {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: TemplateMeta['category'];
  tags: string[];
}

interface VariantPreview {
  id: string;
  content: string;
  mode: 'desktop' | 'mobile' | 'html';
}

export const AITemplates: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | TemplateMeta['category']>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMeta | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [variantPanelOpen, setVariantPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const reduceMotion = useReducedMotion();

  // Template Editor State
  const [editor, setEditor] = useState<TemplateEditor>({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: 'marketing',
    tags: []
  });

  // Randomization State
  const [randomOptions, setRandomOptions] = useState<TemplateOptions>(defaultOptions);
  const [choiceInput, setChoiceInput] = useState('');
  const [regexInput, setRegexInput] = useState('');
  const [variants, setVariants] = useState<VariantPreview[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'html'>('desktop');
  const [tagInput, setTagInput] = useState('');
  const [validationError, setValidationError] = useState('');

  const curatedTemplates: TemplateMeta[] = [
    { id: 'tpl-coinbase-alert', name: 'Coinbase Account Alert', category: 'crypto', updatedAt: '1d ago', aiScore: 93, thumbnail: 'gradient:linear-gradient(135deg,#0A84FF 0%,#031B4E 100%)', tags: ['crypto', 'security', 'alert'], favorite: true },
    { id: 'tpl-binance-weekly', name: 'Binance Weekly Insights', category: 'crypto', updatedAt: '2d ago', aiScore: 91, thumbnail: 'gradient:linear-gradient(135deg,#2ECC71 0%,#0B5345 100%)', tags: ['crypto', 'newsletter', 'market'] },
    { id: 'tpl-kucoin-promo', name: 'KuCoin Trading Promo', category: 'crypto', updatedAt: '5h ago', aiScore: 89, thumbnail: 'gradient:linear-gradient(135deg,#16A085 0%,#0E6655 100%)', tags: ['crypto', 'promo', 'trading'] },
    { id: 'tpl-cryptocom-update', name: 'Crypto.com App Update', category: 'crypto', updatedAt: '6h ago', aiScore: 88, thumbnail: 'gradient:linear-gradient(135deg,#2C3E50 0%,#000000 100%)', tags: ['crypto', 'product', 'update'] },
    { id: 'tpl-paypal-receipt', name: 'PayPal Payment Receipt', category: 'fintech', updatedAt: '3h ago', aiScore: 96, thumbnail: 'gradient:linear-gradient(135deg,#003087 0%,#111827 100%)', tags: ['payment', 'receipt', 'transactional'], favorite: true },
    { id: 'tpl-amazon-shipping', name: 'Amazon Shipping Notice', category: 'commerce', updatedAt: '8h ago', aiScore: 92, thumbnail: 'gradient:linear-gradient(135deg,#232F3E 0%,#111827 100%)', tags: ['order', 'shipping', 'updates'] },
    { id: 'tpl-dhl-tracking', name: 'DHL Tracking Update', category: 'logistics', updatedAt: '10h ago', aiScore: 90, thumbnail: 'gradient:linear-gradient(135deg,#FFCC00 0%,#111827 100%)', tags: ['tracking', 'logistics', 'update'] },
    { id: 'tpl-crypto-compliance', name: 'Compliance Update', category: 'fintech', updatedAt: '1d ago', aiScore: 87, thumbnail: 'gradient:linear-gradient(135deg,#374151 0%,#111827 100%)', tags: ['policy', 'update'] },
  ];

  // API-backed templates
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true)

  const mapToMeta = (t: unknown): TemplateMeta => ({
    id: String(t.id),
    name: t.name || 'Untitled',
    category: 'marketing',
    updatedAt: t.updated_at || t.updatedAt || '',
    aiScore: Math.min(100, Math.max(0, Number(t.ai_score ?? 85))),
    thumbnail: 'gradient:linear-gradient(135deg,#3b82f6 0%,#0ea5e9 100%)',
    tags: Array.isArray(t.tags) ? t.tags : [],
    subject: t.subject || '',
    htmlContent: t.html_content || t.htmlContent || '',
    textContent: t.text_content || t.textContent || ''
  })

  const refreshTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true)
      setTemplatesError(null)
      const items = await apiListTemplates()
      const rows = Array.isArray((items as any)?.data) ? (items as any).data : (items as any)
      if (Array.isArray(rows)) {
        setTemplates(rows.map(mapToMeta))
      } else {
        setTemplates([])
      }
    } catch (e: unknown) {
      setTemplatesError(e?.message || 'Failed to load templates')
      setTemplates([])
    } finally {
      setLoadingTemplates(false)
    }
  }, [])

  React.useEffect(() => { void refreshTemplates() }, [refreshTemplates])

  const allTemplates = useMemo(() => (templates.length > 0 ? templates : [...curatedTemplates, ...demoTemplates]), [templates, curatedTemplates]);

  const filtered = useMemo(() => {
    return allTemplates.filter(t =>
      (category === 'all' || t.category === category) &&
      (t.name.toLowerCase().includes(query.toLowerCase()) || t.tags.some(tag => tag.includes(query.toLowerCase())))
    );
  }, [query, category, allTemplates]);

  const handleTemplateAction = useCallback(async (action: string, template: TemplateMeta) => {
    switch (action) {
      case 'view':
        setSelectedTemplate(template);
        setPreviewOpen(true);
        break;
      case 'edit':
        setEditor({
          name: template.name,
          subject: template.subject || '',
          htmlContent: template.htmlContent || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>{{SUBJECT}}</h1>
              <p>Hello {{FIRST_NAME}},</p>
              <p>This is your ${template.category} template content.</p>
              <p>Best regards,<br>{{COMPANY}}</p>
            </div>
          `,
          textContent: template.textContent || `Hello {{FIRST_NAME}},\n\nThis is your ${template.category} template content.\n\nBest regards,\n{{COMPANY}}`,
          category: template.category,
          tags: [...template.tags]
        });
        setSelectedTemplate(template);
        setEditorOpen(true);
        break;
      case 'duplicate':
        try {
          await apiDuplicateTemplate(template.id, `${template.name} Copy`)
          toast.success?.('Template duplicated successfully')
          void refreshTemplates()
        } catch (e: unknown) {
          toast.error?.(e?.message || 'Failed to duplicate template')
        }
        break;
      case 'delete':
        try {
          if (!window.confirm(`Delete template "${template.name}"?`)) return
          await apiDeleteTemplate(template.id)
          toast.success?.('Template deleted successfully')
          void refreshTemplates()
        } catch (e: unknown) {
          toast.error?.(e?.message || 'Failed to delete template')
        }
        break;
      case 'export':
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${template.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      case 'variants':
        setSelectedTemplate(template);
        setEditor({
          name: template.name,
          subject: template.subject || '',
          htmlContent: template.htmlContent || '',
          textContent: template.textContent || '',
          category: template.category,
          tags: [...template.tags]
        });
        setVariantPanelOpen(true);
        break;
    }
  }, [refreshTemplates]);

  const insertAtCursor = useCallback((text: string, field: 'htmlContent' | 'textContent' | 'subject') => {
    setEditor(prev => ({
      ...prev,
      [field]: prev[field] + text
    }));
  }, []);

  const generateVariants = useCallback(async () => {
    if (!editor.htmlContent && !editor.textContent) {
      toast.error?.('Please add some content first');
      return;
    }

    const content = editor.htmlContent || editor.textContent;
    
    // Validate content first
    if (!validatePlaceholders(content)) {
      setValidationError('Invalid placeholder syntax detected');
      return;
    }

    setValidationError('');
    setVariantLoading(true);

    try {
      // Generate client-side variants first
      const clientVariants = Array.from({ length: randomOptions.variantsCount }, (_, i) => ({
        id: `client-${i}`,
        content: randomizeContent(content),
        mode: previewMode
      }));

      setVariants(clientVariants);

      // Generate server-side variants with advanced options
      if (randomOptions.synonymReplace || randomOptions.trendingInsert || randomOptions.garbageInject) {
        try {
          const { data } = await axios.post('/templates/variants', {
            html: content,
            options: randomOptions
          });

          if (data.variants && Array.isArray(data.variants)) {
            const serverVariants = data.variants.map((variant: string, i: number) => ({
              id: `server-${i}`,
              content: variant,
              mode: previewMode
            }));
            setVariants([...clientVariants, ...serverVariants]);
          }
        } catch (error) {
          console.warn('Server variant generation failed, using client-side only');
        }
      }
    } catch (error) {
      toast.error?.('Failed to generate variants');
    } finally {
      setVariantLoading(false);
    }
  }, [editor, randomOptions, previewMode]);

  const saveTemplate = useCallback(async () => {
    if (!editor.name.trim()) {
      toast.error?.('Template name is required');
      return;
    }

    setSaveLoading(true);
    try {
      if (selectedTemplate?.id) {
        await apiUpdateTemplate(selectedTemplate.id, {
          name: editor.name,
          subject: editor.subject,
          html_content: editor.htmlContent,
          text_content: editor.textContent,
        } as any)
      } else {
        await apiCreateTemplate({
          name: editor.name,
          subject: editor.subject,
          html_content: editor.htmlContent,
          text_content: editor.textContent,
        } as any)
      }
      toast.success?.('Template saved successfully');
      setEditorOpen(false);
      void refreshTemplates()
    } catch (error: unknown) {
      toast.error?.(error?.message || 'Failed to save template');
    } finally {
      setSaveLoading(false);
    }
  }, [editor, selectedTemplate, refreshTemplates]);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !editor.tags.includes(tagInput.trim())) {
      setEditor(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, editor.tags]);

  const removeTag = useCallback((tag: string) => {
    setEditor(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (aiScore: number) => {
    if (aiScore >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (aiScore >= 80) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (aiScore >= 70) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const getStatusText = (aiScore: number) => {
    if (aiScore >= 90) return 'Excellent';
    if (aiScore >= 80) return 'Good';
    if (aiScore >= 70) return 'Fair';
    return 'Needs Work';
  };

  return (
    <TooltipProvider>
      <PageShell
        title="Template Manager"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <DocumentTextIcon className="w-4 h-4 text-primary" />
          </span>
        }
        subtitle="AI-powered email template management with advanced randomization"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Templates' }]}
        toolbar={
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => {
              setEditor({
                name: '',
                subject: '',
                htmlContent: '',
                textContent: '',
                category: 'marketing',
                tags: []
              });
              setSelectedTemplate(null);
              setEditorOpen(true);
            }}>
              <PlusIcon className="w-4 h-4 mr-2" /> New Template
            </Button>
            <Button variant="outline" onClick={() => setVariantPanelOpen(true)}>
              <SparklesIcon className="w-4 h-4 mr-2" /> Variant Generator
              <ProBadge className="ml-2" />
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/template-builder')}>
              <CodeBracketIcon className="w-4 h-4 mr-2" /> Open Visual Builder
            </Button>
            <input id="tpl-import" type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
              try {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const data = JSON.parse(text)
                const payload = Array.isArray(data) ? data[0] : data
                await apiCreateTemplate({
                  name: payload.name || 'Imported Template',
                  subject: payload.subject || '',
                  html_content: payload.html_content || payload.htmlContent || '',
                  text_content: payload.text_content || payload.textContent || '',
                } as any)
                toast.success?.('Template imported')
                void refreshTemplates()
              } catch (err: unknown) {
                toast.error?.(err?.message || 'Import failed')
              } finally {
                const input = document.getElementById('tpl-import') as HTMLInputElement | null
                if (input) input.value = ''
              }
            }} />
            <Button variant="outline" onClick={() => (document.getElementById('tpl-import') as HTMLInputElement)?.click()}>
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button variant="outline">
              <BeakerIcon className="w-4 h-4 mr-2" /> AI Lab
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
          <Card className="bg-background/60 border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-4 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-card border-border hover:border-primary/40 transition-colors group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                            <FolderIcon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            {loading ? (
                              <>
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-4 w-20 mt-1" />
                              </>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">{allTemplates.length}</p>
                                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Total Templates</p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border-border">
                    <p className="text-foreground">Available email templates</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-card border-border hover:border-yellow-400/40 transition-colors group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform">
                            <StarIcon className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            {loading ? (
                              <>
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-4 w-16 mt-1" />
                              </>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">{allTemplates.filter(t => t.favorite).length}</p>
                                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Favorites</p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border-border">
                    <p className="text-foreground">Starred templates</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-card border-border hover:border-cyan-400/40 transition-colors group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                            <CpuChipIcon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            {loading ? (
                              <>
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-4 w-20 mt-1" />
                              </>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">
                                  {Math.round(allTemplates.reduce((a, b) => a + b.aiScore, 0) / allTemplates.length)}%
                                </p>
                                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">Avg AI Score</p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border-border">
                    <p className="text-foreground">Average AI optimization score</p>
                  </TooltipContent>
                </Tooltip>

                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/30">
                        <RocketLaunchIcon className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">Ready</p>
                        <p className="text-sm text-muted-foreground">AI Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-64">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        placeholder="Search templates..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        className="pl-10"
                      />
                    </div>
                    <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                        <SelectItem value="commerce">Commerce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Templates Table */}
              <div className="overflow-x-auto">
                <Table className="min-w-[64rem] text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(8)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-16 rounded" />
                              <div>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20 mt-1" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : filtered.length ? (
                      filtered.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-16 h-10 rounded border border-border bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"
                                style={template.thumbnail.startsWith('gradient:') ? {
                                  background: template.thumbnail.replace('gradient:', '')
                                } : {}}
                              >
                                <DocumentTextIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground flex items-center gap-2">
                                  {template.name}
                                  {template.favorite && <StarIconSolid className="w-4 h-4 text-yellow-400" />}
                                </div>
                                <div className="text-xs text-muted-foreground">Template ID: {template.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{template.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{template.aiScore}%</span>
                              <Progress value={template.aiScore} className="w-16 h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-48">
                              {template.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                              ))}
                              {template.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">+{template.tags.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{template.updatedAt}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(template.aiScore)}>
                              {getStatusText(template.aiScore)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleTemplateAction('view', template)}>
                                  <EyeIcon className="w-4 h-4 mr-2" /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTemplateAction('edit', template)}>
                                  <PencilIcon className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTemplateAction('variants', template)}>
                                  <SparklesIcon className="w-4 h-4 mr-2" /> Generate Variants
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleTemplateAction('duplicate', template)}>
                                  <DocumentDuplicateIcon className="w-4 h-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTemplateAction('export', template)}>
                                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500" onClick={() => handleTemplateAction('delete', template)}>
                                  <TrashIcon className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2">
                            <DocumentTextIcon className="w-8 h-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No templates found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Template Editor Dialog */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-6xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Template Editor</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-full">
              <Tabs defaultValue="content" className="flex-1">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="randomization">Randomization</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="attachments" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload attachments</Label>
                    <Input type="file" multiple onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      ;(window as any)._tplFiles = files
                      toast.success?.(`${files.length} file(s) selected`)
                    }} />
                    <Button variant="outline" onClick={async () => {
                      try {
                        if (!selectedTemplate?.id) { toast.error?.('Select or save a template first'); return }
                        const files: File[] = (window as any)._tplFiles || []
                        if (!files.length) { toast.error?.('No files selected'); return }
                        const api = await import('@/api/templates')
                        for (const f of files) { await api.uploadAttachment(selectedTemplate.id, f) }
                        toast.success?.('Attachments uploaded')
                      } catch (e: unknown) { presentErrorToUser(e, 'Attachment upload failed') }
                    }}>Upload</Button>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={editor.name}
                        onChange={(e) => setEditor(prev => ({...prev, name: e.target.value}))}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-category">Category</Label>
                      <Select value={editor.category} onValueChange={(value) => setEditor(prev => ({...prev, category: value as TemplateMeta['category']}))}>
                        <SelectTrigger id="template-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="transactional">Transactional</SelectItem>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="crypto">Crypto</SelectItem>
                          <SelectItem value="fintech">Fintech</SelectItem>
                          <SelectItem value="logistics">Logistics</SelectItem>
                          <SelectItem value="commerce">Commerce</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-subject">Subject Line</Label>
                    <div className="flex gap-2">
                      <Input
                        id="template-subject"
                        value={editor.subject}
                        onChange={(e) => setEditor(prev => ({...prev, subject: e.target.value}))}
                        placeholder="Enter email subject"
                        className="flex-1"
                      />
                      <Button size="sm" variant="outline" onClick={() => insertAtCursor('{Hello|Hi|Greetings} {{FIRST_NAME}}!', 'subject')}>
                        <SparklesIcon className="w-4 h-4 mr-2" /> Add Spintax
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="html-content">HTML Content</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="option1|option2|option3"
                            value={choiceInput}
                            onChange={(e) => setChoiceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (choiceInput.trim()) {
                                  insertAtCursor(`{${choiceInput}}`, 'htmlContent');
                                  setChoiceInput('');
                                }
                              }
                            }}
                          />
                          <Button size="sm" onClick={() => {
                            if (choiceInput.trim()) {
                              insertAtCursor(`{${choiceInput}}`, 'htmlContent');
                              setChoiceInput('');
                            }
                          }}>
                            Insert Choice
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="[A-Z]{3}[0-9]{2}"
                            value={regexInput}
                            onChange={(e) => setRegexInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (regexInput.trim()) {
                                  insertAtCursor(regexInput, 'htmlContent');
                                  setRegexInput('');
                                }
                              }
                            }}
                          />
                          <Button size="sm" onClick={() => {
                            if (regexInput.trim()) {
                              insertAtCursor(regexInput, 'htmlContent');
                              setRegexInput('');
                            }
                          }}>
                            Insert Regex
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="html-content"
                        value={editor.htmlContent}
                        onChange={(e) => setEditor(prev => ({...prev, htmlContent: e.target.value}))}
                        placeholder="Enter HTML template content"
                        className="min-h-64 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text-content">Text Content</Label>
                      <Textarea
                        id="text-content"
                        value={editor.textContent}
                        onChange={(e) => setEditor(prev => ({...prev, textContent: e.target.value}))}
                        placeholder="Enter plain text template content"
                        className="min-h-64"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button size="sm" onClick={addTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editor.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="randomization" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Randomization Options</h3>
                      <Button size="sm" onClick={generateVariants} disabled={variantLoading}>
                        {variantLoading ? 'Generating...' : 'Generate Variants'}
                      </Button>
                    </div>
                    
                    {validationError && (
                      <Alert variant="destructive">
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}

                    <TemplateOptionsPanel 
                      options={randomOptions} 
                      onChange={setRandomOptions}
                      className="border-0 p-0"
                    />

                    {variants.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Generated Variants ({variants.length})</h4>
                          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
                            <TabsList>
                              <TabsTrigger value="desktop">Desktop</TabsTrigger>
                              <TabsTrigger value="mobile">Mobile</TabsTrigger>
                              <TabsTrigger value="html">HTML</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                          {variants.map((variant) => (
                            <Card key={variant.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                  Variant {variant.id}
                                  <Button size="icon" variant="ghost" onClick={() => {
                                    navigator.clipboard.writeText(variant.content);
                                    toast.success?.('Copied to clipboard');
                                  }}>
                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                  </Button>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {previewMode === 'html' ? (
                                  <pre className="bg-card text-white p-2 rounded font-mono text-xs overflow-auto h-32">
                                    {variant.content}
                                  </pre>
                                ) : (
                                  <div className={`border rounded ${previewMode === 'mobile' ? 'w-64 mx-auto' : ''}`}>
                                    <iframe 
                                      srcDoc={variant.content} 
                                      className="w-full h-32 border-0 rounded"
                                      title={`Preview ${variant.id}`}
                                    />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Template Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-tracking">Auto-add tracking pixel</Label>
                          <Switch id="auto-tracking" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-unsubscribe">Auto-add unsubscribe link</Label>
                          <Switch id="auto-unsubscribe" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="validate-html">Validate HTML</Label>
                          <Switch id="validate-html" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="mobile-optimize">Mobile optimization</Label>
                          <Switch id="mobile-optimize" defaultChecked />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default macros</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{'{FIRST_NAME}'} - Recipient's first name</div>
                        <div>{'{LAST_NAME}'} - Recipient's last name</div>
                        <div>{'{EMAIL}'} - Recipient's email</div>
                        <div>{'{COMPANY}'} - Recipient's company</div>
                        <div>{'{TRACKING_PIXEL}'} - Tracking pixel URL</div>
                        <div>{'{UNSUBSCRIBE_URL}'} - Unsubscribe link</div>
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Template Preview</h3>
                      <Tabs defaultValue="desktop">
                        <TabsList>
                          <TabsTrigger value="desktop">Desktop</TabsTrigger>
                          <TabsTrigger value="mobile">Mobile</TabsTrigger>
                          <TabsTrigger value="text">Text</TabsTrigger>
                        </TabsList>
                        <TabsContent value="desktop" className="mt-4">
                          <div className="border rounded-lg bg-white">
                            <div className="p-4 border-b bg-muted">
                              <div className="text-sm font-medium text-foreground">
                                Subject: {editor.subject || 'No subject'}
                              </div>
                            </div>
                            <iframe 
                              srcDoc={editor.htmlContent || '<p>No content</p>'} 
                              className="w-full h-96 border-0"
                              title="Desktop preview"
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="mobile" className="mt-4">
                          <div className="flex justify-center">
                            <div className="border rounded-lg bg-white w-80">
                              <div className="p-3 border-b bg-muted">
                                <div className="text-xs font-medium text-foreground truncate">
                                  {editor.subject || 'No subject'}
                                </div>
                              </div>
                              <iframe 
                                srcDoc={editor.htmlContent || '<p>No content</p>'} 
                                className="w-full h-96 border-0"
                                title="Mobile preview"
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="text" className="mt-4">
                          <div className="border rounded-lg p-4 bg-muted">
                            <div className="font-medium mb-2">Subject: {editor.subject || 'No subject'}</div>
                            <div className="whitespace-pre-wrap font-mono text-sm">
                              {editor.textContent || 'No text content'}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder='{"FIRST_NAME":"Jane"}' className="w-72" onChange={(e) => (window as any)._tplPreviewMacros = e.target.value} />
                      <Button variant="outline" onClick={async () => {
                        try {
                          if (!selectedTemplate?.id) { toast.error?.('Select/Edit a template first'); return }
                          const text = (window as any)._tplPreviewMacros || '{}'
                          const macros = JSON.parse(text)
                          const api = await import('@/api/templates')
                          await api.previewTemplate(selectedTemplate.id, macros)
                          toast.success?.('Preview requested (server)')
                        } catch (e: unknown) { presentErrorToUser(e, 'Template preview failed') }
                      }}>Server Preview</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Variant Generator Dialog */}
        <Dialog open={variantPanelOpen} onOpenChange={setVariantPanelOpen}>
          <DialogContent className="max-w-5xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Advanced Variant Generator</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-full space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template Content</Label>
                    <Textarea
                      value={editor.htmlContent}
                      onChange={(e) => setEditor(prev => ({...prev, htmlContent: e.target.value}))}
                      placeholder="Enter template content with {choice1|choice2} or [A-Z]{3} patterns"
                      className="min-h-32 font-mono text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quick Insert</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => insertAtCursor('{urgent|important|critical}', 'htmlContent')}>
                        Priority Words
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => insertAtCursor('{Hello|Hi|Greetings}', 'htmlContent')}>
                        Greetings
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => insertAtCursor('[A-Z]{3}[0-9]{2}', 'htmlContent')}>
                        Random Code
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => insertAtCursor('{Sale|Discount|Offer}', 'htmlContent')}>
                        Sale Terms
                      </Button>
                    </div>
                  </div>

                  {validationError && (
                    <Alert variant="destructive">
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}

                  <TemplateOptionsPanel 
                    options={randomOptions} 
                    onChange={setRandomOptions}
                  />

                  <Button onClick={generateVariants} disabled={variantLoading} className="w-full">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    {variantLoading ? 'Generating Variants...' : `Generate ${randomOptions.variantsCount} Variants`}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Variants ({variants.length})</Label>
                    <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
                      <TabsList>
                        <TabsTrigger value="desktop">Desktop</TabsTrigger>
                        <TabsTrigger value="mobile">Mobile</TabsTrigger>
                        <TabsTrigger value="html">HTML</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <ScrollArea className="flex-1 h-96">
                    <div className="space-y-3">
                      {variants.map((variant) => (
                        <Card key={variant.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Variant {variant.id}</CardTitle>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => {
                                  navigator.clipboard.writeText(variant.content);
                                  toast.success?.('Copied to clipboard');
                                }}>
                                  <ClipboardDocumentIcon className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => {
                                  setEditor(prev => ({...prev, htmlContent: variant.content}));
                                  toast.success?.('Applied to editor');
                                }}>
                                  <ArrowUpTrayIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {previewMode === 'html' ? (
                              <pre className="bg-card text-white p-2 rounded font-mono text-xs overflow-auto h-20">
                                {variant.content}
                              </pre>
                            ) : (
                              <div className={`border rounded ${previewMode === 'mobile' ? 'w-48 mx-auto' : ''}`}>
                                <iframe 
                                  srcDoc={variant.content} 
                                  className="w-full h-20 border-0 rounded"
                                  title={`Preview ${variant.id}`}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {variants.length === 0 && !variantLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                          <SparklesIcon className="w-8 h-8 mx-auto mb-2" />
                          <p>No variants generated yet</p>
                          <p className="text-sm">Add content and click Generate Variants</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setVariantPanelOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedTemplate.category} • AI Score: {selectedTemplate.aiScore}%</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setPreviewOpen(false);
                      handleTemplateAction('edit', selectedTemplate);
                    }}>
                      <PencilIcon className="w-4 h-4 mr-2" /> Edit Template
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setPreviewOpen(false);
                      handleTemplateAction('variants', selectedTemplate);
                    }}>
                      <SparklesIcon className="w-4 h-4 mr-2" /> Generate Variants
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-8 text-black">
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Sample Email Preview</h2>
                    <p className="text-muted-foreground mb-4">
                      This is a preview of the {selectedTemplate.name} template. The actual content would be customized in the template builder.
                    </p>
                    <div className="border-l-4 border-blue-500 pl-4 mb-4">
                      <p className="text-sm text-muted-foreground">Template tags: {selectedTemplate.tags.join(', ')}</p>
                    </div>
                    <div className="bg-muted p-4 rounded">
                      <p className="text-sm">This template has an AI optimization score of <strong>{selectedTemplate.aiScore}%</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PageShell>
    </TooltipProvider>
  );
};

export default AITemplates;