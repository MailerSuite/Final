import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import {
  Home,
  BarChart3,
  Users,
  Mail,
  Settings,
  FileText,
  Shield,
  Zap,
  Database,
  Globe,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Cpu,
  Activity,
  Lock,
  Cloud,
  Palette,
  Code,
  Terminal,
  GitBranch,
  Package,
  Server,
  Wifi,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Camera,
  Mic,
  Volume2,
  MessageSquare,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Plus,
  Minus,
  X
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ElementType
  href?: string
  badge?: string | number
  children?: SidebarItem[]
  color?: string
  glow?: boolean
}

interface Sidebar3DProps {
  className?: string
  items?: SidebarItem[]
  onNavigate?: (href: string) => void
  defaultCollapsed?: boolean
  variant?: 'glass' | 'solid' | 'neon' | 'holographic'
  position?: 'left' | 'right'
}

const defaultItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'from-blue-500 to-cyan-500',
    glow: true
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    badge: 'New',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: Mail,
    href: '/campaigns',
    badge: 12,
    color: 'from-green-500 to-emerald-500',
    children: [
      { id: 'all-campaigns', label: 'All Campaigns', icon: FileText, href: '/campaigns/all' },
      { id: 'create', label: 'Create New', icon: Plus, href: '/campaigns/new' },
      { id: 'templates', label: 'Templates', icon: Layers, href: '/campaigns/templates' }
    ]
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    href: '/contacts',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Zap,
    href: '/automation',
    color: 'from-yellow-500 to-orange-500',
    glow: true
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    href: '/security',
    color: 'from-red-500 to-rose-500'
  },
  {
    id: 'database',
    label: 'Database',
    icon: Database,
    href: '/database',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Globe,
    href: '/integrations',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    color: 'from-gray-500 to-slate-500'
  }
]

export function Sidebar3D({
  className,
  items = defaultItems,
  onNavigate,
  defaultCollapsed = false,
  variant = 'glass',
  position = 'left'
}: Sidebar3DProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeItem, setActiveItem] = useState<string>('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    if (variant === 'holographic') {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [variant])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleItemClick = (item: SidebarItem) => {
    if (item.children) {
      toggleExpanded(item.id)
    } else if (item.href) {
      setActiveItem(item.id)
      onNavigate?.(item.href)
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'bg-white/5 dark:bg-black/20 backdrop-blur-xl border-white/10'
      case 'solid':
        return 'bg-gradient-to-b from-slate-900 to-slate-950 border-border'
      case 'neon':
        return 'bg-black/90 border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]'
      case 'holographic':
        return 'bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-cyan-900/20 backdrop-blur-xl border-white/20'
      default:
        return ''
    }
  }

  const renderIcon = (Icon: React.ElementType, item: SidebarItem) => {
    const iconClasses = cn(
      'h-5 w-5 transition-all duration-300',
      {
        'text-white': variant === 'neon' && hoveredItem === item.id,
        'drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]': variant === 'neon' && hoveredItem === item.id,
        'text-transparent bg-clip-text bg-gradient-to-r': item.glow && hoveredItem === item.id
      },
      item.glow && hoveredItem === item.id && item.color
    )

    return <Icon className={iconClasses} />
  }

  const renderItem = (item: SidebarItem, depth = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const isActive = activeItem === item.id
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id} className="relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300',
                  'transform-gpu preserve-3d',
                  'hover:translate-z-[5px] hover:scale-[1.02]',
                  {
                    'bg-gradient-to-r text-white shadow-lg': isActive && item.color,
                    'hover:bg-white/10 dark:hover:bg-white/5': !isActive,
                    'ml-6': depth > 0,
                    [item.color || '']: isActive && item.color,
                    'shadow-[0_0_20px_rgba(0,255,255,0.5)]': isActive && variant === 'neon',
                  }
                )}
                style={{
                  transform: hoveredItem === item.id 
                    ? 'perspective(1000px) rotateY(-2deg) translateZ(10px)' 
                    : 'perspective(1000px) rotateY(0) translateZ(0)',
                  boxShadow: hoveredItem === item.id && item.glow
                    ? `0 0 30px ${item.color ? 'currentColor' : 'rgba(0,255,255,0.5)'}`
                    : undefined
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {renderIcon(item.icon, item)}
                    {!collapsed && (
                      <span className={cn(
                        'font-medium transition-all duration-300',
                        {
                          'text-transparent bg-clip-text bg-gradient-to-r': isActive && item.color,
                          [item.color || '']: isActive && item.color
                        }
                      )}>
                        {item.label}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full font-medium',
                          'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
                          'shadow-[0_0_10px_rgba(0,200,255,0.5)]'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {hasChildren && (
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform duration-300',
                          { 'rotate-90': isExpanded }
                        )} />
                      )}
                    </div>
                  )}
                </div>
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                <p>{item.label}</p>
                {item.badge && <p className="text-xs">({item.badge})</p>}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* 3D Hover Effect Line */}
        {hoveredItem === item.id && (
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: `linear-gradient(135deg, transparent, rgba(0,255,255,0.1), transparent)`,
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        {/* Children Items */}
        {!collapsed && isExpanded && hasChildren && (
          <div className={cn(
            'mt-1 space-y-0.5 overflow-hidden',
            'animate-in slide-in-from-top-2 duration-300'
          )}>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative h-full border-r transition-all duration-500',
        'transform-gpu preserve-3d',
        getVariantClasses(),
        {
          'w-[280px]': !collapsed,
          'w-[80px]': collapsed,
        },
        className
      )}
      style={{
        transform: collapsed 
          ? 'perspective(1000px) rotateY(-5deg)' 
          : 'perspective(1000px) rotateY(0)',
        transformOrigin: position === 'left' ? 'left center' : 'right center'
      }}
    >
      {/* Background Effects */}
      {variant === 'holographic' && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,255,255,0.3), transparent 50%)`,
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-cyan-500 animate-pulse" />
              <div className="absolute inset-0 blur-md bg-cyan-500/50 animate-pulse" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">
              SpamGPT Pro
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-white/10 transition-all duration-300 hover:scale-110"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className={cn(
                'w-full pl-10 pr-3 py-2 rounded-lg',
                'bg-white/5 border border-white/10',
                'focus:bg-white/10 focus:border-cyan-500/50',
                'focus:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
                'transition-all duration-300',
                'placeholder:text-muted-foreground'
              )}
            />
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 pb-4">
          {items.map(item => renderItem(item))}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-white/10 p-4">
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          'bg-gradient-to-r from-white/5 to-white/10',
          'hover:from-white/10 hover:to-white/15',
          'transition-all duration-300',
          'hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]'
        )}>
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">admin@spamgpt.com</p>
            </div>
          )}
        </div>
      </div>

      {/* 3D Shadow Effect */}
      <div
        className="absolute inset-y-0 -right-4 w-4 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)',
          filter: 'blur(4px)'
        }}
      />
    </div>
  )
}