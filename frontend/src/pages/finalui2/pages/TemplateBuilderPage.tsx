import React, { useState, useRef } from 'react';
import { 
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  CubeTransparentIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  ClockIcon,
  Square3Stack3DIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  LinkIcon,
  VideoCameraIcon,
  MapPinIcon,
  CalendarIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
// Removed legacy design-system.css; relying on Tailwind/shadcn styles

// Types
interface TemplateBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'video' | 'social' | 'spacer' | 'columns';
  content: any;
  styles: any;
}

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  blocks: TemplateBlock[];
}

const TemplateBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState('blocks');
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlockType, setDraggedBlockType] = useState<string | null>(null);
  
  // Available block types
  const blockTypes = [
    { id: 'text', label: 'Text', icon: DocumentTextIcon, color: 'cyan' },
    { id: 'image', label: 'Image', icon: PhotoIcon, color: 'emerald' },
    { id: 'button', label: 'Button', icon: CubeTransparentIcon, color: 'purple' },
    { id: 'divider', label: 'Divider', icon: Square3Stack3DIcon, color: 'slate' },
    { id: 'video', label: 'Video', icon: VideoCameraIcon, color: 'red' },
    { id: 'social', label: 'Social', icon: ShareIcon, color: 'blue' },
    { id: 'spacer', label: 'Spacer', icon: Square3Stack3DIcon, color: 'gray' },
    { id: 'columns', label: 'Columns', icon: Square3Stack3DIcon, color: 'amber' }
  ];

  // Sample templates
  const templates: Template[] = [
    {
      id: '1',
      name: 'Welcome Email',
      category: 'Onboarding',
      thumbnail: '📧',
      blocks: []
    },
    {
      id: '2',
      name: 'Newsletter',
      category: 'Marketing',
      thumbnail: '📰',
      blocks: []
    },
    {
      id: '3',
      name: 'Product Launch',
      category: 'Promotional',
      thumbnail: '🚀',
      blocks: []
    },
    {
      id: '4',
      name: 'Survey Request',
      category: 'Feedback',
      thumbnail: '📊',
      blocks: []
    }
  ];

  const handleDragStart = (blockType: string) => {
    setIsDragging(true);
    setDraggedBlockType(blockType);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedBlockType(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlockType) {
      const newBlock: TemplateBlock = {
        id: crypto.randomUUID(),
        type: draggedBlockType as any,
        content: getDefaultContent(draggedBlockType),
        styles: getDefaultStyles(draggedBlockType)
      };
      setBlocks([...blocks, newBlock]);
    }
    handleDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: 'Enter your text here...', heading: 'h3' };
      case 'button':
        return { text: 'Click Me', url: '#', alignment: 'center' };
      case 'image':
        return { src: '', alt: 'Image', width: '100%' };
      case 'divider':
        return { style: 'solid', color: '#e2e8f0', thickness: 1 };
      case 'spacer':
        return { height: 40 };
      case 'video':
        return { url: '', thumbnail: '', autoplay: false };
      case 'social':
        return { 
          icons: ['facebook', 'twitter', 'instagram', 'linkedin'],
          alignment: 'center'
        };
      case 'columns':
        return { columns: 2, gap: 20 };
      default:
        return {};
    }
  };

  const getDefaultStyles = (type: string) => {
    return {
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
      margin: { top: 0, right: 0, bottom: 20, left: 0 },
      backgroundColor: 'transparent',
      borderRadius: 0
    };
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlock === id) {
      setSelectedBlock(null);
    }
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (blockToDuplicate) {
      const newBlock = {
        ...blockToDuplicate,
        id: crypto.randomUUID()
      };
      const index = blocks.findIndex(b => b.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    }
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < blocks.length - 1)
    ) {
      const newBlocks = [...blocks];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const renderBlock = (block: TemplateBlock) => {
    const isSelected = selectedBlock === block.id;
    
    return (
      <div
        key={block.id}
        className={cn(
          "relative group cursor-pointer transition-all",
          "border-2 border-transparent hover:border-cyan-500/50",
          isSelected && "border-cyan-500 shadow-lg shadow-cyan-500/20",
          "rounded-lg"
        )}
        style={{
          padding: `${block.styles.padding.top}px ${block.styles.padding.right}px ${block.styles.padding.bottom}px ${block.styles.padding.left}px`,
          margin: `${block.styles.margin.top}px ${block.styles.margin.right}px ${block.styles.margin.bottom}px ${block.styles.margin.left}px`,
          backgroundColor: block.styles.backgroundColor,
          borderRadius: `${block.styles.borderRadius}px`
        }}
        onClick={() => setSelectedBlock(block.id)}
      >
        {/* Block Actions */}
        <div className={cn(
          "absolute -top-10 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-card hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              moveBlock(block.id, 'up');
            }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-card hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              moveBlock(block.id, 'down');
            }}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-card hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              duplicateBlock(block.id);
            }}
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-card hover:bg-red-700"
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(block.id);
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Block Content */}
        <div className="min-h-[60px] flex items-center justify-center">
          {block.type === 'text' && (
            <p className="text-muted-foreground">{block.content.text}</p>
          )}
          {block.type === 'button' && (
            <Button className="bg-gradient-primary">{block.content.text}</Button>
          )}
          {block.type === 'image' && (
            <div className="w-full h-32 bg-card rounded flex items-center justify-center">
              <PhotoIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {block.type === 'divider' && (
            <hr className="w-full border-border" />
          )}
          {block.type === 'spacer' && (
            <div style={{ height: `${block.content.height}px` }} />
          )}
          {block.type === 'video' && (
            <div className="w-full h-48 bg-card rounded flex items-center justify-center">
              <VideoCameraIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {block.type === 'social' && (
            <div className="flex gap-3 justify-center">
              {block.content.icons.map((icon: string) => (
                <div key={icon} className="w-8 h-8 bg-muted rounded-full" />
              ))}
            </div>
          )}
          {block.type === 'columns' && (
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="h-24 bg-card rounded" />
              <div className="h-24 bg-card rounded" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const getCanvasWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        {/* Header Toolbar */}
        <Card variant="elevated" className="flex items-center justify-between rounded-none border-x-0 border-t-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            <Separator orientation="vertical" className="h-6 bg-muted" />
            
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-64"
            />
            
            <Badge variant="outline" className="status-info">
              Auto-saved
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 bg-card/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowUturnLeftIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowUturnRightIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>
            
            {/* View Mode */}
            <div className="flex items-center gap-1 bg-card/50 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('desktop')}
                  >
                    <ComputerDesktopIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desktop View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'tablet' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('tablet')}
                  >
                    <DevicePhoneMobileIcon className="w-4 h-4 rotate-90" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tablet View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setViewMode('mobile')}
                  >
                    <DevicePhoneMobileIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mobile View</TooltipContent>
              </Tooltip>
            </div>
            
            <Separator orientation="vertical" className="h-6 bg-muted" />
            
            {/* Actions */}
            <Button variant="outline" className="bg-card/50 border-border">
              <EyeIcon className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button variant="outline" className="bg-card/50 border-border">
              <CodeBracketIcon className="w-4 h-4 mr-2" />
              HTML
            </Button>
            
            <Button className="bg-gradient-primary">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              Send Test
            </Button>
          </div>
        </Card>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Card variant="elevated" className="w-80 border-r border-x-0 border-y-0 rounded-none">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="m-4">
                <TabsTrigger value="blocks" className="flex-1">Blocks</TabsTrigger>
                <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
                <TabsTrigger value="assets" className="flex-1">Assets</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 px-4">
                <TabsContent value="blocks" className="mt-0">
                  <div className="space-y-4 pb-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Basic Blocks</h3>
                      <div className="premium-grid-2">
                        {blockTypes.map((block) => (
                          <Card
                            key={block.id}
                            draggable
                            onDragStart={() => handleDragStart(block.id)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "glass-card cursor-move hover-lift",
                              "transition-all hover:border-cyan-500/50"
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  block.color === 'cyan' && "bg-cyan-500/10",
                                  block.color === 'emerald' && "bg-emerald-500/10",
                                  block.color === 'purple' && "bg-purple-500/10",
                                  block.color === 'slate' && "bg-muted/10",
                                  block.color === 'red' && "bg-red-500/10",
                                  block.color === 'blue' && "bg-blue-500/10",
                                  block.color === 'gray' && "bg-muted/10",
                                  block.color === 'amber' && "bg-amber-500/10"
                                )}>
                                  <block.icon className={cn(
                                    "w-5 h-5",
                                    block.color === 'cyan' && "text-cyan-400",
                                    block.color === 'emerald' && "text-emerald-400",
                                    block.color === 'purple' && "text-purple-400",
                                    block.color === 'slate' && "text-muted-foreground",
                                    block.color === 'red' && "text-red-400",
                                    block.color === 'blue' && "text-blue-400",
                                    block.color === 'gray' && "text-muted-foreground",
                                    block.color === 'amber' && "text-amber-400"
                                  )} />
                                </div>
                                <span className="text-xs text-muted-foreground">{block.label}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Advanced Blocks</h3>
                      <div className="space-y-2">
                        <Card className="glass-card cursor-move hover-lift">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-5 h-5 text-amber-400" />
                              <span className="text-sm text-muted-foreground">Event Block</span>
                              <Badge variant="outline" className="ml-auto badge-accent">
                                Pro
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="glass-card cursor-move hover-lift">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <MapPinIcon className="w-5 h-5 text-emerald-400" />
                              <span className="text-sm text-muted-foreground">Location Block</span>
                              <Badge variant="outline" className="ml-auto badge-accent">
                                Pro
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="templates" className="mt-0">
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="glass-card hover-lift cursor-pointer">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-4xl mb-2">{template.thumbnail}</div>
                            <h4 className="text-sm font-medium text-white">{template.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{template.category}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="assets" className="mt-0">
                  <div className="space-y-4 pb-4">
                    <Card className="glass-card">
                      <CardContent className="p-6 text-center">
                        <PhotoIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Drop images here or</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Browse Files
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </Card>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-background/50 p-4">
            <div 
              className="mx-auto bg-white rounded-lg shadow-2xl transition-all"
              style={{ width: getCanvasWidth(), minHeight: '600px' }}
            >
              <div
                ref={canvasRef}
                className={cn(
                  "min-h-[600px] p-4",
                  showGrid && "bg-grid-pattern",
                  isDragging && "ring-2 ring-cyan-500 ring-offset-4 ring-offset-slate-900"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {blocks.length === 0 ? (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <CubeTransparentIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Start Building Your Template
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Drag blocks from the left sidebar to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blocks.map(renderBlock)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          {selectedBlock && (
            <div className="w-80 border-l border-border bg-background/30">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-medium text-white">Block Properties</h3>
              </div>
              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="p-4 space-y-4">
                  {/* Content Settings */}
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {blocks.find(b => b.id === selectedBlock)?.type === 'text' && (
                        <>
                          <div>
                            <Label className="text-xs">Text</Label>
                            <Textarea 
                              className="mt-1 bg-card/50 border-border text-white"
                              placeholder="Enter text..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Heading Level</Label>
                            <Select defaultValue="h3">
                              <SelectTrigger className="mt-1 bg-card/50 border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border">
                                <SelectItem value="h1">H1</SelectItem>
                                <SelectItem value="h2">H2</SelectItem>
                                <SelectItem value="h3">H3</SelectItem>
                                <SelectItem value="p">Paragraph</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {blocks.find(b => b.id === selectedBlock)?.type === 'button' && (
                        <>
                          <div>
                            <Label className="text-xs">Button Text</Label>
                            <Input 
                              className="mt-1 bg-card/50 border-border text-white"
                              placeholder="Click Me"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">URL</Label>
                            <Input 
                              className="mt-1 bg-card/50 border-border text-white"
                              placeholder="https://..."
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Style Settings */}
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Styles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Background Color</Label>
                        <Input 
                          type="color"
                          className="mt-1 h-10 bg-card/50 border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Border Radius</Label>
                        <Slider 
                          defaultValue={[0]} 
                          max={20} 
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Padding</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Input 
                            type="number"
                            placeholder="Top"
                            className="bg-card/50 border-border text-white"
                          />
                          <Input 
                            type="number"
                            placeholder="Right"
                            className="bg-card/50 border-border text-white"
                          />
                          <Input 
                            type="number"
                            placeholder="Bottom"
                            className="bg-card/50 border-border text-white"
                          />
                          <Input 
                            type="number"
                            placeholder="Left"
                            className="bg-card/50 border-border text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Settings */}
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Advanced</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Hide on Mobile</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Full Width</Label>
                        <Switch />
                      </div>
                      <div>
                        <Label className="text-xs">Custom CSS Class</Label>
                        <Input 
                          className="mt-1 bg-card/50 border-border text-white"
                          placeholder="custom-class"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/50">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="status-active">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
              Connected
            </Badge>
            <span className="text-xs text-muted-foreground">
              {blocks.length} blocks • Last saved: Just now
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Show Grid</Label>
              <Switch 
                checked={showGrid}
                onCheckedChange={setShowGrid}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              <Cog6ToothIcon className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </TooltipProvider>
  );
};

export default TemplateBuilderPage;