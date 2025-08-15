/**
 * Visual Template Builder Component
 * Modern drag-and-drop email template builder with cyberpunk aesthetic
 * Enhanced with rounded design and performance optimizations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import type { DropTargetMonitor } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Eye, 
  Save, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Trash2, 
  Copy, 
  Move, 
  Settings,
  Palette,
  Grid,
  Type,
  Image,
  MousePointer,
  Minus,
  Share2,
  FileText,
  Loader2,
  Download,
  Sparkles,
  Zap,
  Layers,
  RotateCcw,
  MoreVertical
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import * as TemplateAPI from '@/api/template-builder-api'
import { cn } from '@/lib/utils'

// Re-export types for local use
type TemplateLayout = TemplateAPI.TemplateLayout
type TemplateBlock = TemplateAPI.TemplateBlock
type TemplateBlockType = TemplateAPI.TemplateBlockType
type TemplateTheme = TemplateAPI.TemplateTheme
type CreateLayoutRequest = TemplateAPI.CreateLayoutRequest
type CreateBlockRequest = TemplateAPI.CreateBlockRequest
type UpdateBlockRequest = TemplateAPI.UpdateBlockRequest

const templateBuilderApi = TemplateAPI.templateBuilderApi

// ===== TYPES =====

interface VisualTemplateBuilderProps {
  sessionId: string
  initialLayoutId?: string
  onTemplateGenerated?: (templateId: string) => void
  className?: string
}

interface DragItem {
  type: string
  blockType?: string
  blockId?: string
  block?: TemplateBlock
}

interface DropResult {
  type: string
  rowIndex: number
  columnIndex: number
}

// ===== DRAG AND DROP TYPES =====
const ItemTypes = {
  BLOCK_TYPE: 'block_type',
  EXISTING_BLOCK: 'existing_block'
}

// ===== BLOCK TYPE PALETTE =====
const BlockTypePalette: React.FC<{
  blockTypes: TemplateBlockType[]
  onBlockTypeSelect: (blockType: TemplateBlockType) => void
}> = React.memo(({ blockTypes, onBlockTypeSelect }) => {
  const categories = blockTypes.reduce((acc, blockType) => {
    if (!acc[blockType.category]) {
      acc[blockType.category] = []
    }
    acc[blockType.category].push(blockType)
    return acc
  }, {} as Record<string, TemplateBlockType[]>)

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([category, types], categoryIndex) => (
        <motion.div 
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: categoryIndex * 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
              {category}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {types.map((blockType, index) => (
              <motion.div
                key={blockType.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
              >
                <DraggableBlockType blockType={blockType} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
})

// ===== DRAGGABLE BLOCK TYPE =====
const DraggableBlockType: React.FC<{ blockType: TemplateBlockType }> = React.memo(({ blockType }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BLOCK_TYPE,
    item: { type: ItemTypes.BLOCK_TYPE, blockType: blockType.type_name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Type': <Type className="h-5 w-5" />,
      'Heading': <Type className="h-5 w-5" />,
      'Image': <Image className="h-5 w-5" />,
      'MousePointer': <MousePointer className="h-5 w-5" />,
      'Minus': <Minus className="h-5 w-5" />,
      'Move': <Move className="h-5 w-5" />,
      'Share2': <Share2 className="h-5 w-5" />,
      'FileText': <FileText className="h-5 w-5" />,
      'Sparkles': <Sparkles className="h-5 w-5" />,
      'Zap': <Zap className="h-5 w-5" />
    }
    return iconMap[iconName || 'Grid'] || <Grid className="h-5 w-5" />
  }

  return (
    <motion.div
      ref={drag}
      whileHover={{ 
        scale: 1.02, 
        y: -2,
        boxShadow: blockType.is_premium 
          ? '0 0 20px rgba(251, 191, 36, 0.4)'
          : '0 0 20px rgba(59, 130, 246, 0.3)'
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "card-cyber relative rounded-2xl p-4 cursor-grab transition-all duration-300",
        "border-2 border-dashed group hover:border-solid",
        "flex flex-col items-center justify-center text-center min-h-[100px]",
        isDragging && "opacity-50",
        blockType.is_premium 
          ? "border-amber-400/50 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 hover:border-amber-400"
          : "border-primary/30 bg-gradient-to-br from-card/50 to-primary/5 hover:border-primary/60"
      )}
    >
      {/* Premium glow effect */}
      {blockType.is_premium && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/10 via-yellow-400/5 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Icon with glow */}
      <motion.div 
        className={cn(
          "relative mb-2 p-2 rounded-full transition-all duration-300",
          blockType.is_premium 
            ? "text-amber-600 bg-amber-100/50 group-hover:bg-amber-200/50"
            : "text-primary bg-primary/10 group-hover:bg-primary/20"
        )}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.3 }}
      >
        {getIcon(blockType.icon)}
        {blockType.is_premium && (
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400/30"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
      
      {/* Label */}
      <span className={cn(
        "text-sm font-semibold mb-1 transition-colors duration-300",
        blockType.is_premium ? "text-amber-700" : "text-foreground"
      )}>
        {blockType.display_name}
      </span>
      
      {/* Description */}
      {blockType.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 px-1">
          {blockType.description}
        </p>
      )}
      
      {/* Premium badge */}
      {blockType.is_premium && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-lg"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        </motion.div>
      )}
      
      {/* Drag indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-30 group-hover:opacity-60 transition-opacity">
        <div className="w-1 h-1 bg-current rounded-full" />
        <div className="w-1 h-1 bg-current rounded-full" />
        <div className="w-1 h-1 bg-current rounded-full" />
      </div>
    </motion.div>
  )
})

// ===== DRAGGABLE EXISTING BLOCK =====
const DraggableExistingBlock: React.FC<{
  block: TemplateBlock
  onSelect: (block: TemplateBlock) => void
  onUpdate: (blockId: string, updates: UpdateBlockRequest) => void
  onDelete: (blockId: string) => void
  isSelected: boolean
}> = React.memo(({ block, onSelect, onUpdate, onDelete, isSelected }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EXISTING_BLOCK,
    item: { type: ItemTypes.EXISTING_BLOCK, blockId: block.id, block },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  const renderBlockContent = () => {
    switch (block.block_type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            <p style={{ fontSize: block.styling?.font_size || '14px', color: block.styling?.color || 'currentColor' }}>
              {block.content?.text || 'Text content'}
            </p>
          </div>
        )
      case 'heading': {
        const HeadingTag = `h${block.content?.level || 2}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag 
            style={{ 
              fontSize: block.styling?.font_size || '24px', 
              color: block.styling?.color || 'currentColor',
              margin: 0,
              fontWeight: 'bold'
            }}
          >
            {block.content?.text || 'Heading text'}
          </HeadingTag>
        )
      }
      case 'image':
        return (
          <div className="relative overflow-hidden rounded-xl">
            <img 
              src={block.content?.src || 'https://via.placeholder.com/300x150?text=Image+Block'} 
              alt={block.content?.alt || 'Image'} 
              className="max-w-full h-auto object-cover"
              style={{ maxHeight: '150px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )
      case 'button':
        return (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-full font-semibold transition-all duration-300 shadow-lg"
            style={{
              backgroundColor: block.styling?.background_color || '#3b82f6',
              color: block.styling?.color || '#ffffff',
              padding: block.styling?.padding || '12px 24px',
              fontSize: block.styling?.font_size || '16px',
              fontWeight: block.styling?.font_weight || 'bold',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span className="relative z-10">{block.content?.text || 'Button'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </motion.button>
        )
      case 'divider':
        return (
          <div className="flex items-center justify-center py-4">
            <hr 
              className="transition-all duration-300"
              style={{
                border: 'none',
                borderTop: `${block.styling?.border_width || '2px'} ${block.styling?.border_style || 'solid'} ${block.styling?.border_color || 'currentColor'}`,
                width: block.styling?.width || '100%',
                opacity: 0.3
              }}
            />
          </div>
        )
      case 'spacer':
        return (
          <div 
            className="relative bg-gradient-to-r from-transparent via-primary/10 to-transparent rounded-xl border-2 border-dashed border-primary/20"
            style={{
              height: block.content?.height || '40px',
              width: '100%'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-medium">
              Spacer ({block.content?.height || '40px'})
            </div>
          </div>
        )
      default:
        return (
          <div className="text-muted-foreground text-sm p-4 bg-muted/20 rounded-xl border-2 border-dashed border-muted/30 text-center">
            <div className="font-medium mb-1">Unknown Block</div>
            <div className="text-xs">{block.block_type}</div>
          </div>
        )
    }
  }

  return (
    <motion.div
      ref={drag}
      onClick={() => onSelect(block)}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative card-cyber rounded-2xl p-4 cursor-pointer group transition-all duration-300",
        "border-2 min-h-[80px] backdrop-blur-sm",
        isDragging && "opacity-50 scale-95",
        isSelected 
          ? "border-primary bg-primary/10 shadow-neon"
          : "border-border/50 hover:border-primary/50 hover:bg-card/50"
      )}
      style={{
        gridColumn: `span ${block.column_span}`
      }}
      layout
    >
      {/* Selection glow */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Block Controls */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-2 -right-2 flex gap-1 z-10"
          >
            <Button
              size="icon-sm"
              variant="destructive"
              className="h-7 w-7 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(block.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="h-7 w-7 rounded-full shadow-lg bg-background/95"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Add copy functionality
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Content */}
      <div className="select-none relative z-[1]">
        {renderBlockContent()}
      </div>

      {/* Block Type Badge */}
      <Badge 
        variant={isSelected ? "default" : "secondary"} 
        className={cn(
          "absolute bottom-2 left-2 text-xs font-medium rounded-full px-2 py-1",
          isSelected && "bg-primary/20 text-primary border-primary/30"
        )}
      >
        <Layers className="w-3 h-3 mr-1" />
        {block.block_type}
      </Badge>
      
      {/* Drag indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity">
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.div>
  )
})

// ===== DROP ZONE GRID =====
const DropZoneGrid: React.FC<{
  layout: TemplateLayout
  blocks: TemplateBlock[]
  onBlockDrop: (item: DragItem, row: number, column: number) => void
  onBlockSelect: (block: TemplateBlock) => void
  onBlockUpdate: (blockId: string, updates: UpdateBlockRequest) => void
  onBlockDelete: (blockId: string) => void
  selectedBlock?: TemplateBlock
}> = React.memo(({ layout, blocks, onBlockDrop, onBlockSelect, onBlockUpdate, onBlockDelete, selectedBlock }) => {
  const maxRows = Math.max(...blocks.map(b => b.row_position), 0) + 5 // Add extra rows for flexibility
  const maxColumns = 12 // Standard 12-column grid

  // Group blocks by position
  const blockGrid = blocks.reduce((grid, block) => {
    const key = `${block.row_position}-${block.column_position}`
    grid[key] = block
    return grid
  }, {} as Record<string, TemplateBlock>)

  const DropZone: React.FC<{ row: number, column: number }> = React.memo(({ row, column }) => {
    const [{ canDrop, isOver }, drop] = useDrop(() => ({
      accept: [ItemTypes.BLOCK_TYPE, ItemTypes.EXISTING_BLOCK],
      drop: (item: DragItem) => {
        onBlockDrop(item, row, column)
        return { type: 'drop_zone', rowIndex: row, columnIndex: column }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      })
    }))

    const block = blockGrid[`${row}-${column}`]

    return (
      <div
        ref={drop}
        className={cn(
          "relative rounded-xl min-h-[100px] flex items-center justify-center transition-all duration-300",
          "border-2 border-dashed backdrop-blur-sm",
          canDrop && isOver 
            ? "border-primary bg-primary/10 shadow-neon scale-105" 
            : canDrop 
            ? "border-primary/40 bg-primary/5"
            : "border-border/20 hover:border-border/40"
        )}
        style={{ gridColumn: `${column + 1}` }}
      >
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 25%, currentColor 25%), 
              linear-gradient(-45deg, transparent 25%, currentColor 25%), 
              linear-gradient(45deg, currentColor 75%, transparent 75%), 
              linear-gradient(-45deg, currentColor 75%, transparent 75%)
            `,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
          }} />
        </div>
        
        {block ? (
          <DraggableExistingBlock
            block={block}
            onSelect={onBlockSelect}
            onUpdate={onBlockUpdate}
            onDelete={onBlockDelete}
            isSelected={selectedBlock?.id === block.id}
          />
        ) : (
          <AnimatePresence>
            {canDrop && isOver && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-2 text-primary font-medium"
              >
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="p-3 rounded-full bg-primary/20"
                >
                  <Plus className="w-6 h-6" />
                </motion.div>
                <span className="text-sm">Drop here</span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        {/* Grid coordinates (only visible on hover) */}
        <div className="absolute top-1 left-1 text-xs text-muted-foreground/30 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          {row},{column}
        </div>
      </div>
    )
  })
  
  DropZone.displayName = 'DropZone'

  return (
    <div 
      className="grid gap-3 p-6 min-h-[500px] relative overflow-hidden rounded-3xl"
      style={{ 
        gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
        background: layout.background_color 
          ? `linear-gradient(135deg, ${layout.background_color} 0%, ${layout.background_color}dd 100%)`
          : 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)/0.8) 100%)'
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Grid cells */}
      {Array.from({ length: maxRows }, (_, row) =>
        Array.from({ length: maxColumns }, (_, column) => (
          <DropZone key={`${row}-${column}`} row={row} column={column} />
        ))
      )}
      
      {/* Empty state */}
      {blocks.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="mb-4 p-6 rounded-full bg-primary/10"
          >
            <Layers className="w-12 h-12 text-primary" />
          </motion.div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Start Building Your Template
          </h3>
          <p className="text-muted-foreground max-w-md">
            Drag and drop blocks from the left sidebar to create your email template.
            Mix and match different content types to build the perfect layout.
          </p>
        </motion.div>
      )}
    </div>
  )
})

// ===== MAIN COMPONENT =====
export const VisualTemplateBuilder: React.FC<VisualTemplateBuilderProps> = ({
  sessionId,
  initialLayoutId,
  onTemplateGenerated,
  className
}) => {
  const [currentLayout, setCurrentLayout] = useState<TemplateLayout | null>(null)
  const [blocks, setBlocks] = useState<TemplateBlock[]>([])
  const [blockTypes, setBlockTypes] = useState<TemplateBlockType[]>([])
  const [themes, setThemes] = useState<TemplateTheme[]>([])
  const [selectedBlock, setSelectedBlock] = useState<TemplateBlock | undefined>()
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme | undefined>()
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateSubject, setTemplateSubject] = useState('')

  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ===== LOAD INITIAL DATA =====
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        // Load block types and themes in parallel
        const [blockTypesData, themesData] = await Promise.all([
          templateBuilderApi.getBlockTypes(),
          templateBuilderApi.getThemes()
        ])

        setBlockTypes(blockTypesData)
        setThemes(themesData)

        // Set default theme
        const featuredTheme = themesData.find(t => t.is_featured)
        if (featuredTheme) {
          setSelectedTheme(featuredTheme)
        }

        // Load existing layout or create new one
        if (initialLayoutId) {
          const layout = await templateBuilderApi.getLayout(initialLayoutId, sessionId)
          setCurrentLayout(layout)
          setBlocks(layout.blocks || [])
        } else {
          // Create a new layout
          const newLayout = await templateBuilderApi.createLayout(sessionId, {
            name: 'New Email Template',
            layout_type: 'single_column',
            grid_system: '12_column',
            container_settings: { max_width: '600' },
            background_color: '#ffffff'
          })
          setCurrentLayout(newLayout)
        }
      } catch (error) {
        console.error('Error loading template builder data:', error)
        toast({
          title: "Error",
          description: "Failed to load template builder. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [sessionId, initialLayoutId])

  // ===== AUTO-SAVE =====
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (currentLayout) {
        try {
          // Create builder session and save state
          const builderState = {
            current_state: {
              layout_id: currentLayout.id,
              blocks: blocks,
              selected_theme_id: selectedTheme?.id,
              last_modified: new Date().toISOString()
            }
          }

          // Update builder state (auto-save)
          // Note: This would require creating a builder session first
          // For now, we'll just log that auto-save would happen
          console.log('Auto-save triggered:', builderState)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, 2000) // 2 second delay
  }, [currentLayout, blocks, selectedTheme])

  // ===== HANDLE BLOCK DROP =====
  const handleBlockDrop = useCallback(async (item: DragItem, row: number, column: number) => {
    if (!currentLayout) return

    try {
      if (item.type === ItemTypes.BLOCK_TYPE && item.blockType) {
        // Find the block type configuration
        const blockTypeConfig = blockTypes.find(bt => bt.type_name === item.blockType)
        if (!blockTypeConfig) return

        // Create new block
        const newBlockData: CreateBlockRequest = {
          block_type: item.blockType,
          row_position: row,
          column_position: column,
          column_span: 12, // Full width by default
          content: blockTypeConfig.default_config,
          styling: blockTypeConfig.default_styles
        }

        const newBlock = await templateBuilderApi.createBlock(currentLayout.id, sessionId, newBlockData)
        setBlocks(prevBlocks => [...prevBlocks, newBlock])
        
        toast({
          title: "Block Added",
          description: `${blockTypeConfig.display_name} added to your template.`
        })
      } else if (item.type === ItemTypes.EXISTING_BLOCK && item.block && item.blockId) {
        // Move existing block
        const updates: UpdateBlockRequest = {
          row_position: row,
          column_position: column
        }

        const updatedBlock = await templateBuilderApi.updateBlock(item.blockId, sessionId, updates)
        setBlocks(prevBlocks => 
          prevBlocks.map(block => 
            block.id === item.blockId ? { ...block, ...updates } : block
          )
        )

        toast({
          title: "Block Moved",
          description: "Block position updated successfully."
        })
      }

      triggerAutoSave()
    } catch (error) {
      console.error('Error handling block drop:', error)
      toast({
        title: "Error",
        description: "Failed to add/move block. Please try again.",
        variant: "destructive"
      })
    }
  }, [currentLayout, sessionId, blockTypes, triggerAutoSave])

  // ===== HANDLE BLOCK UPDATE =====
  const handleBlockUpdate = useCallback(async (blockId: string, updates: UpdateBlockRequest) => {
    try {
      await templateBuilderApi.updateBlock(blockId, sessionId, updates)
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.id === blockId ? { ...block, ...updates } : block
        )
      )
      triggerAutoSave()
    } catch (error) {
      console.error('Error updating block:', error)
      toast({
        title: "Error",
        description: "Failed to update block. Please try again.",
        variant: "destructive"
      })
    }
  }, [sessionId, triggerAutoSave])

  // ===== HANDLE BLOCK DELETE =====
  const handleBlockDelete = useCallback(async (blockId: string) => {
    try {
      await templateBuilderApi.deleteBlock(blockId, sessionId)
      setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId))
      setSelectedBlock(undefined)
      
      toast({
        title: "Block Deleted",
        description: "Block removed from template."
      })
      
      triggerAutoSave()
    } catch (error) {
      console.error('Error deleting block:', error)
      toast({
        title: "Error",
        description: "Failed to delete block. Please try again.",
        variant: "destructive"
      })
    }
  }, [sessionId, triggerAutoSave])

  // ===== GENERATE TEMPLATE =====
  const handleGenerateTemplate = useCallback(async () => {
    if (!currentLayout || !templateName.trim() || !templateSubject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both template name and subject line.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await templateBuilderApi.generateTemplate(currentLayout.id, sessionId, {
        template_name: templateName,
        template_subject: templateSubject,
        apply_theme_id: selectedTheme?.id
      })

      toast({
        title: "Template Generated!",
        description: `Template "${templateName}" has been created successfully.`
      })

      if (onTemplateGenerated) {
        onTemplateGenerated(result.template_id)
      }
    } catch (error) {
      console.error('Error generating template:', error)
      toast({
        title: "Error",
        description: "Failed to generate template. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, [currentLayout, sessionId, templateName, templateSubject, selectedTheme, onTemplateGenerated])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-8 card-cyber rounded-3xl backdrop-blur-glass"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className="relative"
          >
            <Loader2 className="h-12 w-12 text-primary mx-auto" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Initializing Neural Interface</h3>
            <p className="text-sm text-muted-foreground">Loading template builder components...</p>
          </div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("template-builder h-screen bg-gradient-to-br from-background via-background to-primary/5", className)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen p-6">
          {/* Left Sidebar - Block Palette */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 card-cyber rounded-3xl backdrop-blur-glass p-6 overflow-hidden"
          >
            <Tabs defaultValue="blocks" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted/30">
                <TabsTrigger value="blocks" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Grid className="w-4 h-4 mr-2" />
                  Blocks
                </TabsTrigger>
                <TabsTrigger value="themes" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Palette className="w-4 h-4 mr-2" />
                  Themes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="blocks" className="mt-6 flex-1 overflow-hidden">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Block Library
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Drag blocks to the canvas to build your template
                  </p>
                </div>
                <ScrollArea className="h-full pr-4">
                  <BlockTypePalette 
                    blockTypes={blockTypes} 
                    onBlockTypeSelect={() => {}} // Handled by drag and drop
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="themes" className="mt-6 flex-1 overflow-hidden">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Theme Gallery
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a theme to style your template
                  </p>
                </div>
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {themes.map((theme, index) => (
                      <motion.div
                        key={theme.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          variant={selectedTheme?.id === theme.id ? "premium" : "default"}
                          className={cn(
                            "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                            selectedTheme?.id === theme.id 
                              ? "ring-2 ring-primary shadow-neon" 
                              : "hover:shadow-lg"
                          )}
                          onClick={() => setSelectedTheme(theme)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex gap-1">
                                <motion.div 
                                  className="w-4 h-4 rounded-full border shadow-sm"
                                  style={{ backgroundColor: theme.primary_color }}
                                  whileHover={{ scale: 1.2 }}
                                />
                                <motion.div 
                                  className="w-4 h-4 rounded-full border shadow-sm"
                                  style={{ backgroundColor: theme.secondary_color }}
                                  whileHover={{ scale: 1.2 }}
                                />
                                <motion.div 
                                  className="w-4 h-4 rounded-full border shadow-sm"
                                  style={{ backgroundColor: theme.accent_color }}
                                  whileHover={{ scale: 1.2 }}
                                />
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-sm">{theme.name}</span>
                                {theme.is_premium && (
                                  <Badge className="ml-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs rounded-full">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Pro
                                  </Badge>
                                )}
                              </div>
                              {selectedTheme?.id === theme.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </motion.div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {theme.description || "Beautiful theme for your email templates"}
                            </p>
                            {theme.rating && (
                              <div className="flex items-center gap-1 mt-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      i < Math.floor(theme.rating!) ? "bg-amber-400" : "bg-muted"
                                    )}
                                  />
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">
                                  {theme.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Center - Canvas */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 flex flex-col overflow-hidden"
          >
            {/* Toolbar */}
            <div className="card-cyber rounded-2xl backdrop-blur-glass p-4 mb-6 flex items-center justify-between border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Input
                    placeholder="Template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-48 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all"
                  />
                  <motion.div 
                    className="absolute inset-0 rounded-xl border-2 border-primary/50 pointer-events-none"
                    animate={{
                      opacity: templateName ? [0.3, 0.7, 0.3] : 0
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div className="relative">
                  <Input
                    placeholder="Subject line"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    className="w-48 rounded-xl bg-background/50 border-border/50 focus:border-primary transition-all"
                  />
                  <motion.div 
                    className="absolute inset-0 rounded-xl border-2 border-secondary/50 pointer-events-none"
                    animate={{
                      opacity: templateSubject ? [0.3, 0.7, 0.3] : 0
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Device Preview Toggle */}
                <div className="flex border border-border/50 rounded-2xl p-1 bg-muted/30">
                  <Button
                    size="sm"
                    variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                    onClick={() => setPreviewDevice('desktop')}
                    className="rounded-xl h-8"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
                    onClick={() => setPreviewDevice('tablet')}
                    className="rounded-xl h-8"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                    onClick={() => setPreviewDevice('mobile')}
                    className="rounded-xl h-8"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-8" />

                <Button variant="outline" size="sm" className="rounded-xl">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>

                <Button 
                  variant={isSaving ? "ghost" : "ai"}
                  onClick={handleGenerateTemplate}
                  disabled={isSaving || !templateName.trim() || !templateSubject.trim()}
                  size="sm"
                  className="rounded-xl relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {isSaving ? (
                      <motion.div
                        key="saving"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="generate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Generate
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* AI effect */}
                  {!isSaving && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-muted/20 via-transparent to-primary/5 p-6 rounded-3xl">
              <motion.div 
                animate={{
                  maxWidth: previewDevice === 'mobile' ? '384px' : 
                           previewDevice === 'tablet' ? '768px' : '1024px'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="mx-auto bg-background shadow-2xl rounded-3xl border-2 border-border/20 backdrop-blur-sm overflow-hidden"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Device frame */}
                <div className="bg-muted/30 px-4 py-2 border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-destructive/60" />
                        <div className="w-3 h-3 rounded-full bg-warning/60" />
                        <div className="w-3 h-3 rounded-full bg-success/60" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {previewDevice} preview
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs rounded-full">
                      {blocks.length} blocks
                    </Badge>
                  </div>
                </div>
                {currentLayout && (
                  <DropZoneGrid
                    layout={currentLayout}
                    blocks={blocks}
                    onBlockDrop={handleBlockDrop}
                    onBlockSelect={setSelectedBlock}
                    onBlockUpdate={handleBlockUpdate}
                    onBlockDelete={handleBlockDelete}
                    selectedBlock={selectedBlock}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Sidebar - Properties */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 card-cyber rounded-3xl backdrop-blur-glass p-6 overflow-hidden"
          >
            <div className="space-y-4">
              <h3 className="font-semibold">Properties</h3>
              
              {selectedBlock ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Block Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Block Type</Label>
                      <p className="text-sm font-medium capitalize">{selectedBlock.block_type}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={selectedBlock.block_name || ''}
                        onChange={(e) => handleBlockUpdate(selectedBlock.id, { block_name: e.target.value })}
                        placeholder="Block name"
                        size="sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Column Span</Label>
                        <Select
                          value={selectedBlock.column_span.toString()}
                          onValueChange={(value) => handleBlockUpdate(selectedBlock.id, { column_span: parseInt(value) })}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 6, 12].map(span => (
                              <SelectItem key={span} value={span.toString()}>
                                {span} col{span > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Block-specific content editing would go here */}
                    {selectedBlock.block_type === 'text' && (
                      <div>
                        <Label className="text-xs">Text Content</Label>
                        <textarea
                          className="w-full text-sm border rounded px-2 py-1"
                          rows={3}
                          value={selectedBlock.content?.text || ''}
                          onChange={(e) => handleBlockUpdate(selectedBlock.id, {
                            content: { ...selectedBlock.content, text: e.target.value }
                          })}
                        />
                      </div>
                    )}

                    {selectedBlock.block_type === 'button' && (
                      <>
                        <div>
                          <Label className="text-xs">Button Text</Label>
                          <Input
                            value={selectedBlock.content?.text || ''}
                            onChange={(e) => handleBlockUpdate(selectedBlock.id, {
                              content: { ...selectedBlock.content, text: e.target.value }
                            })}
                            size="sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Button URL</Label>
                          <Input
                            value={selectedBlock.content?.url || ''}
                            onChange={(e) => handleBlockUpdate(selectedBlock.id, {
                              content: { ...selectedBlock.content, url: e.target.value }
                            })}
                            size="sm"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    Select a block to edit its properties
                  </CardContent>
                </Card>
              )}

              {/* Layout Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Layout Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Background Color</Label>
                    <Input
                      type="color"
                      value={currentLayout?.background_color || '#ffffff'}
                      onChange={(e) => {
                        if (currentLayout) {
                          templateBuilderApi.updateLayout(currentLayout.id, sessionId, {
                            background_color: e.target.value
                          }).then(() => {
                            setCurrentLayout({ ...currentLayout, background_color: e.target.value })
                          })
                        }
                      }}
                      className="w-full h-8"
                    />
                  </div>

                  {selectedTheme && (
                    <div>
                      <Label className="text-xs">Selected Theme</Label>
                      <p className="text-sm font-medium">{selectedTheme.name}</p>
                      <div className="flex gap-1 mt-1">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: selectedTheme.primary_color }}
                          title="Primary"
                        />
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: selectedTheme.secondary_color }}
                          title="Secondary"
                        />
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: selectedTheme.accent_color }}
                          title="Accent"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default VisualTemplateBuilder 