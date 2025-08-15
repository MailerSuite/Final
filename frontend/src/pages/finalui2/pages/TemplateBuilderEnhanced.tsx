import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DocumentTextIcon,
  SparklesIcon,
  PhotoIcon,
  LinkIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  CubeTransparentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  BoltIcon,
  BeakerIcon,
  CommandLineIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  RectangleGroupIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  TagIcon,
  ShoppingCartIcon,
  GiftIcon,
  HeartIcon,
  StarIcon,
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  FireIcon,
  LightBulbIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  HomeIcon,
  MusicalNoteIcon,
  FilmIcon,
  CameraIcon,
  MicrophoneIcon,
  WifiIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShareIcon,
  CheckIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
// Removed design-system/ui-kit usage; using Shadcn components only
import PageShell from '../components/PageShell';
import { toast } from '@/hooks/useToast';

interface TemplateBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'social' | 'video' | 'html' | 'product' | 'countdown';
  content: unknown;
  styles: Record<string, any>;
  animation?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  variableSchema?: VariableSchema;
  spamScore?: number;
  deliverabilityScore?: number;
}

interface VariableSchema {
  required: string[];
  optional: string[];
  types: Record<string, 'string' | 'number' | 'date' | 'boolean' | 'array'>;
  examples: Record<string, any>;
  validation: Record<string, string>; // regex patterns
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  spamScore: number;
  deliverabilityScore: number;
}

const TemplateBuilderEnhanced: React.FC = () => {
  const [template, setTemplate] = useState<EmailTemplate>({
    id: 'template-1',
    name: 'Untitled Template',
    subject: 'Your Subject Line',
    content: '<h1 style="text-align: center; color: #22d3ee;">Your Amazing Header</h1>',
    variables: ['firstName', 'lastName', 'email'],
    category: 'marketing',
    isActive: true,
    createdAt: new Date().toISOString(),
    variableSchema: {
      required: ['firstName', 'email'],
      optional: ['lastName', 'company', 'product'],
      types: {
        firstName: 'string',
        lastName: 'string',
        email: 'string',
        company: 'string',
        product: 'string'
      },
      examples: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        product: 'Premium Plan'
      },
      validation: {
        email: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        firstName: '^[a-zA-Z\\s]{1,50}$'
      }
    },
    spamScore: 0,
    deliverabilityScore: 0
  });

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isDragging, setIsDragging] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [variableSchema, setVariableSchema] = useState<VariableSchema>({
    required: ['firstName', 'email'],
    optional: ['lastName', 'company', 'product'],
    types: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      company: 'string',
      product: 'string'
    },
    examples: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      product: 'Premium Plan'
    },
    validation: {
      email: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      firstName: '^[a-zA-Z\\s]{1,50}$'
    }
  });
  const [validationResult, setValidationResult] = React.useState<ValidationResult | null>(null)
  const [templateVersions, setTemplateVersions] = React.useState<Array<{
    id: string
    version: string
    name: string
    content: string
    subject: string
    createdBy: string
    createdAt: string
    isPublished: boolean
    changes: string
  }>>([])
  const [currentVersion, setCurrentVersion] = React.useState('1.0.0')
  const [showVersionHistory, setShowVersionHistory] = React.useState(false)
  const [collaborators, setCollaborators] = React.useState<Array<{
    id: string
    name: string
    email: string
    role: 'owner' | 'editor' | 'viewer'
    lastActive: string
  }>>([])
  const [showCollaborators, setShowCollaborators] = React.useState(false)
  const [newCollaborator, setNewCollaborator] = React.useState({ email: '', role: 'viewer' as const })

  // Template categories
  const categories = [
    { id: 'marketing', label: 'Marketing', icon: ChartBarIcon },
    { id: 'newsletter', label: 'Newsletter', icon: EnvelopeIcon },
    { id: 'transactional', label: 'Transactional', icon: CreditCardIcon },
    { id: 'welcome', label: 'Welcome', icon: HeartIcon },
    { id: 'promotional', label: 'Promotional', icon: TagIcon },
    { id: 'event', label: 'Event', icon: CalendarIcon },
    { id: 'survey', label: 'Survey', icon: ClipboardDocumentListIcon },
    { id: 'announcement', label: 'Announcement', icon: BellIcon }
  ];

  // Block types
  const blockTypes = [
    { type: 'text', label: 'Text', icon: DocumentTextIcon, color: 'cyan' },
    { type: 'image', label: 'Image', icon: PhotoIcon, color: 'blue' },
    { type: 'button', label: 'Button', icon: CubeTransparentIcon, color: 'purple' },
    { type: 'divider', label: 'Divider', icon: MinusIcon, color: 'gray' },
    { type: 'spacer', label: 'Spacer', icon: Squares2X2Icon, color: 'gray' },
    { type: 'social', label: 'Social', icon: UserGroupIcon, color: 'pink' },
    { type: 'video', label: 'Video', icon: FilmIcon, color: 'red' },
    { type: 'html', label: 'HTML', icon: CodeBracketIcon, color: 'green' },
    { type: 'product', label: 'Product', icon: ShoppingCartIcon, color: 'yellow' },
    { type: 'countdown', label: 'Countdown', icon: ClockIcon, color: 'orange' }
  ];

  // AI Content Templates
  const aiTemplates = {
    promotional: [
      "🎉 Exclusive {{discount}}% Off - This Weekend Only!",
      "⚡ Flash Sale: Save Big on {{product}}",
      "🔥 Hot Deal Alert: {{product}} Now {{price}}",
      "✨ Special Offer Just for You, {{firstName}}!",
      "🎁 Gift Yourself {{product}} - Limited Time"
    ],
    welcome: [
      "Welcome to {{company}}, {{firstName}}! 🎊",
      "Hey {{firstName}}, Thanks for Joining Us!",
      "Your Journey with {{company}} Starts Now",
      "Welcome Aboard, {{firstName}}! Let's Get Started",
      "{{firstName}}, You're Part of Something Special"
    ],
    newsletter: [
      "📰 This Week at {{company}}: {{headline}}",
      "{{month}} Newsletter: What's New & Exciting",
      "🚀 Product Updates & Industry News",
      "📊 Monthly Insights from {{company}}",
      "💡 Tips, Tricks & Updates - {{month}} Edition"
    ],
    transactional: [
      "Order #{{orderNumber}} Confirmed ✅",
      "Your {{product}} is On Its Way! 📦",
      "Payment Received - Thank You!",
      "Reset Your Password - Action Required",
      "Account Update: Important Information"
    ]
  };

  // Pre-built template blocks
  const prebuiltBlocks = {
    header: {
      type: 'text' as const,
      content: {
        text: '<h1 style="text-align: center; color: #22d3ee;">Your Amazing Header</h1>'
      },
      styles: {
        padding: '20px',
        backgroundColor: 'transparent'
      }
    },
    hero: {
      type: 'image' as const,
      content: {
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="%2322d3ee" offset="0%"/><stop stop-color="%233b82f6" offset="100%"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>',
        alt: 'Hero Image'
      },
      styles: {
        width: '100%',
        borderRadius: '8px'
      }
    },
    cta: {
      type: 'button' as const,
      content: {
        text: 'Call to Action',
        url: '#'
      },
      styles: {
        backgroundColor: '#22d3ee',
        color: '#000000',
        padding: '12px 24px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'block',
        width: '200px',
        margin: '20px auto'
      }
    },
    social: {
      type: 'social' as const,
      content: {
        platforms: ['facebook', 'twitter', 'instagram', 'linkedin']
      },
      styles: {
        textAlign: 'center',
        padding: '20px'
      }
    }
  };

  const addBlock = (type: TemplateBlock['type']) => {
    const newBlock: TemplateBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type)
    };

    setTemplate(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };

  const getDefaultContent = (type: TemplateBlock['type']) => {
    switch (type) {
      case 'text':
        return { text: '<p>Enter your text here...</p>' };
      case 'image':
        return { url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="%2322d3ee" offset="0%"/><stop stop-color="%233b82f6" offset="100%"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>', alt: 'Image' };
      case 'button':
        return { text: 'Click Me', url: '#' };
      case 'divider':
        return { style: 'solid', color: '#333333' };
      case 'spacer':
        return { height: 40 };
      case 'social':
        return { platforms: ['facebook', 'twitter', 'instagram'] };
      case 'video':
        return { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail: '' };
      case 'html':
        return { code: '<div>Custom HTML</div>' };
      case 'product':
        return {
          name: 'Product Name',
          price: '$99.99',
          image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="%2322d3ee" offset="0%"/><stop stop-color="%233b82f6" offset="100%"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>',
          description: 'Product description'
        };
      case 'countdown':
        return {
          endDate: new Date(Date.now() + 86400000).toISOString(),
          text: 'Offer ends in:'
        };
      default:
        return {};
    }
  };

  const getDefaultStyles = (type: TemplateBlock['type']) => {
    return {
      padding: '10px',
      margin: '0',
      backgroundColor: 'transparent'
    };
  };

  const deleteBlock = (blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId)
    }));
    setSelectedBlock(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = template.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.blocks.length) return;

    const newBlocks = [...template.blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];

    setTemplate(prev => ({ ...prev, blocks: newBlocks }));
  };

  const generateAIContent = async (type: string) => {
    setGeneratingAI(true);

    // Simulate AI generation
    setTimeout(() => {
      const category = template.category as keyof typeof aiTemplates;
      const templates = aiTemplates[category] || aiTemplates.promotional;
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

      // Replace variables with random values
      const content = randomTemplate
        .replace('{{discount}}', String(Math.floor(Math.random() * 50) + 10))
        .replace('{{product}}', ['Amazing Product', 'Best Seller', 'New Arrival'][Math.floor(Math.random() * 3)])
        .replace('{{price}}', `$${Math.floor(Math.random() * 100) + 19}.99`)
        .replace('{{firstName}}', 'John')
        .replace('{{company}}', 'SpamGPT')
        .replace('{{month}}', new Date().toLocaleString('default', { month: 'long' }))
        .replace('{{headline}}', 'Big Updates & Exciting News')
        .replace('{{orderNumber}}', String(Math.floor(Math.random() * 100000) + 10000));

      if (type === 'subject') {
        setTemplate(prev => ({ ...prev, name: content }));
      } else if (type === 'block' && selectedBlock) {
        const block = template.blocks.find(b => b.id === selectedBlock);
        if (block && block.type === 'text') {
          block.content.text = `<p>${content}</p>`;
          setTemplate(prev => ({ ...prev }));
        }
      }

      setAiSuggestions([
        content,
        ...templates.filter(t => t !== randomTemplate).slice(0, 3)
      ]);

      setGeneratingAI(false);
    }, 1500);
  };

  const generateFullTemplate = () => {
    setGeneratingAI(true);

    setTimeout(() => {
      const newBlocks: TemplateBlock[] = [
        {
          id: `block-${Date.now()}-1`,
          type: 'text',
          content: { text: '<h1 style="text-align: center; color: #22d3ee;">Special Offer Just for You!</h1>' },
          styles: { padding: '30px 20px 10px 20px', backgroundColor: 'transparent' }
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'image',
          content: {
            url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="%2322d3ee" offset="0%"/><stop stop-color="%233b82f6" offset="100%"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>',
            alt: 'Special Offer'
          },
          styles: { width: '100%', borderRadius: '12px', marginBottom: '20px' }
        },
        {
          id: `block-${Date.now()}-3`,
          type: 'text',
          content: {
            text: '<p style="font-size: 18px; line-height: 1.6; color: #e5e5e5;">Don\'t miss out on our exclusive deal! Get <strong style="color: #22d3ee;">50% OFF</strong> on all premium features. This limited-time offer won\'t last long!</p>'
          },
          styles: { padding: '0 20px 20px 20px' }
        },
        {
          id: `block-${Date.now()}-4`,
          type: 'countdown',
          content: {
            endDate: new Date(Date.now() + 259200000).toISOString(), // 3 days
            text: 'Offer expires in:'
          },
          styles: { textAlign: 'center', padding: '20px', fontSize: '24px', color: '#22d3ee' }
        },
        {
          id: `block-${Date.now()}-5`,
          type: 'button',
          content: { text: 'Claim Your Discount', url: 'https://example.com/offer' },
          styles: {
            backgroundColor: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
            color: '#000000',
            padding: '15px 40px',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            display: 'block',
            width: '250px',
            margin: '30px auto',
            boxShadow: '0 4px 15px rgba(34, 211, 238, 0.4)'
          }
        },
        {
          id: `block-${Date.now()}-6`,
          type: 'divider',
          content: { style: 'solid', color: '#333333' },
          styles: { margin: '30px 0' }
        },
        {
          id: `block-${Date.now()}-7`,
          type: 'social',
          content: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin'] },
          styles: { textAlign: 'center', padding: '20px' }
        }
      ];

      setTemplate(prev => ({
        ...prev,
        name: '🎉 Limited Time Offer - 50% OFF!',
        blocks: newBlocks,
        aiScore: 95
      }));

      setGeneratingAI(false);
    }, 2000);
  };

  const exportHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
  };

  const generateHTML = () => {
    const blocksHTML = template.blocks.map(block => {
      const styleString = Object.entries(block.styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (block.type) {
        case 'text':
          return `<div style="${styleString}">${block.content.text}</div>`;
        case 'image':
          return `<img src="${block.content.url}" alt="${block.content.alt}" style="${styleString}" />`;
        case 'button':
          return `<a href="${block.content.url}" style="${styleString}">${block.content.text}</a>`;
        case 'divider':
          return `<hr style="border: ${block.content.style} 1px ${block.content.color}; ${styleString}" />`;
        case 'spacer':
          return `<div style="height: ${block.content.height}px; ${styleString}"></div>`;
        case 'html':
          return block.content.code;
        default:
          return '';
      }
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: ${template.settings.fontFamily};
      background-color: #0a0a0a;
    }
    .email-container {
      max-width: ${template.settings.width}px;
      margin: 0 auto;
      background-color: ${template.settings.backgroundColor};
      padding: ${template.settings.padding}px;
      border-radius: ${template.settings.borderRadius}px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${blocksHTML}
  </div>
</body>
</html>`;
  };

  return (
    <TooltipProvider>
      <PageShell
        title="Template Builder"
        titleIcon={
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/30">
            <DocumentTextIcon className="w-4 h-4 text-primary neon-glow" />
          </span>
        }
        subtitle="Visual email template builder with AI assistance"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeView(!showCodeView)}
              className="border-white/10"
            >
              <CodeBracketIcon className="w-4 h-4 mr-2" />
              {showCodeView ? 'Visual' : 'Code'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="border-white/10"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={generateFullTemplate}>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        }
      >
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          {/* Template Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Version:</Label>
                <Select value={currentVersion} onValueChange={setCurrentVersion}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateVersions.map(v => (
                      <SelectItem key={v.id} value={v.version}>
                        v{v.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(true)}
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                Version History
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCollaborators(true)}
              >
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Team ({collaborators.length})
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm">
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button size="sm">
                <CheckIcon className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          <TabsContent value="builder" className="space-y-6">
            {/* Template Builder Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Block Library */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Block Library</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {blockTypes.map((blockType) => (
                      <Button
                        key={blockType.type}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addBlock(blockType.type)}
                      >
                        <blockType.icon className={`w-4 h-4 mr-2 text-${blockType.color}-500`} />
                        {blockType.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Center - Template Canvas */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={template.content}
                      onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter your HTML content here..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Properties */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Template Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input
                        value={template.name}
                        onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter template name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={template.subject}
                        onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter subject line"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={template.category}
                        onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Variables Used</Label>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <div dangerouslySetInnerHTML={{ __html: template.content }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CodeBracketIcon className="w-5 h-5" />
                  Variable Schema
                </CardTitle>
                <CardDescription>
                  Define and validate template variables for personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Required Variables */}
                <div className="space-y-3">
                  <Label>Required Variables</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variableSchema.required.map((varName, index) => (
                      <div key={varName} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Input
                          value={varName}
                          onChange={(e) => {
                            const newRequired = [...variableSchema.required];
                            newRequired[index] = e.target.value;
                            setVariableSchema(prev => ({ ...prev, required: newRequired }));
                          }}
                          className="flex-1"
                        />
                        <Select
                          value={variableSchema.types[varName] || 'string'}
                          onValueChange={(value: unknown) => setVariableSchema(prev => ({
                            ...prev,
                            types: { ...prev.types, [varName]: value }
                          }))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVariableSchema(prev => ({
                            ...prev,
                            required: prev.required.filter((_, i) => i !== index)
                          }))}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVariableSchema(prev => ({
                        ...prev,
                        required: [...prev.required, `var_${Date.now()}`]
                      }))}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Required
                    </Button>
                  </div>
                </div>

                {/* Optional Variables */}
                <div className="space-y-3">
                  <Label>Optional Variables</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {variableSchema.optional.map((varName, index) => (
                      <div key={varName} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Input
                          value={varName}
                          onChange={(e) => {
                            const newOptional = [...variableSchema.optional];
                            newOptional[index] = e.target.value;
                            setVariableSchema(prev => ({ ...prev, optional: newOptional }));
                          }}
                          className="flex-1"
                        />
                        <Select
                          value={variableSchema.types[varName] || 'string'}
                          onValueChange={(value: unknown) => setVariableSchema(prev => ({
                            ...prev,
                            types: { ...prev.types, [varName]: value }
                          }))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVariableSchema(prev => ({
                            ...prev,
                            optional: prev.optional.filter((_, i) => i !== index)
                          }))}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVariableSchema(prev => ({
                        ...prev,
                        optional: [...prev.optional, `var_${Date.now()}`]
                      }))}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Optional
                    </Button>
                  </div>
                </div>

                {/* Variable Examples */}
                <div className="space-y-3">
                  <Label>Example Values</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(variableSchema.examples).map(([varName, example]) => (
                      <div key={varName} className="space-y-2">
                        <Label className="text-sm text-muted-foreground">{varName}</Label>
                        <Input
                          value={example}
                          onChange={(e) => setVariableSchema(prev => ({
                            ...prev,
                            examples: { ...prev.examples, [varName]: e.target.value }
                          }))}
                          placeholder="Example value"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Rules */}
                <div className="space-y-3">
                  <Label>Validation Rules (Regex)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(variableSchema.validation).map(([varName, pattern]) => (
                      <div key={varName} className="space-y-2">
                        <Label className="text-sm text-muted-foreground">{varName}</Label>
                        <Input
                          value={pattern}
                          onChange={(e) => setVariableSchema(prev => ({
                            ...prev,
                            validation: { ...prev.validation, [varName]: e.target.value }
                          }))}
                          placeholder="^[a-zA-Z]+$"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BeakerIcon className="w-5 h-5" />
                  Template Validation
                </CardTitle>
                <CardDescription>
                  Check template quality, spam score, and deliverability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Validation Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      // Simulate validation
                      const spamScore = Math.floor(Math.random() * 20) + 1;
                      const deliverabilityScore = Math.max(60, 100 - spamScore * 2);

                      const errors: string[] = [];
                      const warnings: string[] = [];

                      if (template.content.includes('FREE') || template.content.includes('FREE!')) {
                        warnings.push('Contains "FREE" which may trigger spam filters');
                      }
                      if (template.content.includes('CLICK HERE')) {
                        warnings.push('Contains "CLICK HERE" which may trigger spam filters');
                      }
                      if (template.content.length < 100) {
                        warnings.push('Content is very short, consider adding more value');
                      }
                      if (template.content.length > 5000) {
                        warnings.push('Content is very long, may affect deliverability');
                      }

                      setValidationResult({
                        isValid: errors.length === 0,
                        errors,
                        warnings,
                        spamScore,
                        deliverabilityScore
                      });
                    }}
                  >
                    <BeakerIcon className="w-4 h-4 mr-2" />
                    Validate Template
                  </Button>
                  <Button variant="outline">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Preview with Variables
                  </Button>
                </div>

                {/* Validation Results */}
                {validationResult && (
                  <div className="space-y-4">
                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className={`w-5 h-5 ${validationResult.spamScore > 10 ? 'text-red-500' : 'text-yellow-500'}`} />
                          <Label>Spam Score</Label>
                        </div>
                        <div className="text-2xl font-bold">{validationResult.spamScore}/100</div>
                        <div className="text-xs text-muted-foreground">
                          {validationResult.spamScore <= 5 ? 'Excellent' :
                            validationResult.spamScore <= 10 ? 'Good' :
                              validationResult.spamScore <= 15 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircleIcon className={`w-5 h-5 ${validationResult.deliverabilityScore > 80 ? 'text-green-500' : 'text-yellow-500'}`} />
                          <Label>Deliverability</Label>
                        </div>
                        <div className="text-2xl font-bold">{validationResult.deliverabilityScore}%</div>
                        <div className="text-xs text-muted-foreground">
                          {validationResult.deliverabilityScore >= 90 ? 'Excellent' :
                            validationResult.deliverabilityScore >= 80 ? 'Good' :
                              validationResult.deliverabilityScore >= 70 ? 'Fair' : 'Poor'}
                        </div>
                      </div>
                    </div>

                    {/* Errors and Warnings */}
                    {validationResult.errors.length > 0 && (
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <h4 className="font-medium text-red-800 mb-2">Errors</h4>
                        <ul className="space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResult.warnings.length > 0 && (
                      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                        <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                        <ul className="space-y-1">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                              <InformationCircleIcon className="w-4 h-4" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {validationResult.spamScore > 10 && (
                          <li>• Avoid excessive use of capital letters and exclamation marks</li>
                        )}
                        {validationResult.spamScore > 15 && (
                          <li>• Review content for spam trigger words</li>
                        )}
                        {template.content.length < 100 && (
                          <li>• Add more valuable content to improve engagement</li>
                        )}
                        <li>• Ensure proper HTML structure and mobile responsiveness</li>
                        <li>• Test with different email clients</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export confirmation dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export HTML</DialogTitle>
              <DialogDescription>
                Download the current template as a standalone HTML file.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
              <Button onClick={() => { exportHTML(); setShowExportDialog(false); }}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Version History Dialog */}
        <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Version History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templateVersions.map(version => (
                  <Card key={version.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={version.isPublished ? 'default' : 'secondary'}>
                            v{version.version}
                          </Badge>
                          {version.isPublished && <Badge variant="outline">Published</Badge>}
                        </div>
                        <h4 className="font-medium mt-1">{version.name}</h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTemplate(prev => prev ? {
                            ...prev,
                            content: version.content,
                            subject: version.subject
                          } : prev)
                          setCurrentVersion(version.version)
                          setShowVersionHistory(false)
                        }}
                      >
                        Restore
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div><strong>Created by:</strong> {version.createdBy}</div>
                      <div><strong>Created:</strong> {new Date(version.createdAt).toLocaleDateString()}</div>
                      <div><strong>Changes:</strong> {version.changes}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Collaborators Dialog */}
        <Dialog open={showCollaborators} onOpenChange={setShowCollaborators}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Team Collaboration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Add New Collaborator */}
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator(prev => ({ ...prev, email: e.target.value }))}
                />
                <Select value={newCollaborator.role} onValueChange={(value: unknown) => setNewCollaborator(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    if (newCollaborator.email) {
                      const collaborator = {
                        id: Date.now().toString(),
                        name: newCollaborator.email.split('@')[0],
                        email: newCollaborator.email,
                        role: newCollaborator.role,
                        lastActive: new Date().toISOString()
                      }
                      setCollaborators(prev => [...prev, collaborator])
                      setNewCollaborator({ email: '', role: 'viewer' })
                      toast.success?.(`Added ${collaborator.name} as ${collaborator.role}`)
                    }
                  }}
                >
                  Add
                </Button>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2">
                {collaborators.map(collaborator => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{collaborator.name}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        collaborator.role === 'owner' ? 'default' : 
                        collaborator.role === 'editor' ? 'secondary' : 'outline'
                      }>
                        {collaborator.role}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCollaborators(prev => prev.filter(c => c.id !== collaborator.id))
                          toast.success?.(`Removed ${collaborator.name}`)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageShell>
    </TooltipProvider>
  );
};

// Add missing import
const ClipboardDocumentListIcon = DocumentTextIcon;

export default TemplateBuilderEnhanced;