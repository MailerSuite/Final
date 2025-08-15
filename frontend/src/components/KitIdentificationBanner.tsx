import React from 'react'
import { AlertTriangle, Package, Layers, Palette, Shield, User, Settings, Archive } from 'lucide-react'

interface KitIdentificationBannerProps {
  kitName: 'Legacy Kit' | 'Admin UI Kit' | 'Client Kit v1' | 'Client Kit v2' | 'Client Kit v3' | 'Shared Components' | 'Custom/Mixed' | 'Unknown'
  componentCount?: number
  migrationPath?: string
  className?: string
}

const kitInfo = {
  'Legacy Kit': {
    color: 'bg-background/20 border-border/30',
    textColor: 'text-muted-foreground',
    icon: Archive,
    status: 'DEPRECATED',
    statusColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Original legacy components - scheduled for removal'
  },
  'Admin UI Kit': {
    color: 'bg-red-900/20 border-red-500/30',
    textColor: 'text-red-300',
    icon: Shield,
    status: 'ACTIVE',
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Administrative interface components'
  },
  'Client Kit v1': {
    color: 'bg-blue-900/20 border-blue-500/30',
    textColor: 'text-blue-300',
    icon: User,
    status: 'DEPRECATED',
    statusColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'First generation client components - migrate to v2/v3'
  },
  'Client Kit v2': {
    color: 'bg-green-900/20 border-green-500/30',
    textColor: 'text-green-300',
    icon: Layers,
    status: 'STABLE',
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Production-ready client components'
  },
  'Client Kit v3': {
    color: 'bg-purple-900/20 border-purple-500/30',
    textColor: 'text-purple-300',
    icon: Palette,
    status: 'BETA',
    statusColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Next-generation components with AI features'
  },
  'Shared Components': {
    color: 'bg-red-900/20 border-red-500/30',
    textColor: 'text-red-300',
    icon: Settings,
    status: 'STABLE',
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Core reusable shadcn/ui components'
  },
  'Custom/Mixed': {
    color: 'bg-orange-900/20 border-orange-500/30',
    textColor: 'text-orange-300',
    icon: Package,
    status: 'REVIEW NEEDED',
    statusColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Mixed components requiring cleanup'
  },
  'Unknown': {
    color: 'bg-background/20 border-border/30',
    textColor: 'text-muted-foreground',
    icon: AlertTriangle,
    status: 'UNIDENTIFIED',
    statusColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Components need kit classification'
  }
}

export default function KitIdentificationBanner({ 
  kitName, 
  componentCount, 
  migrationPath,
  className = '' 
}: KitIdentificationBannerProps) {
  const kit = kitInfo[kitName]

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 
      ${kit.color} border-b-2 backdrop-blur-sm
      ${className}
    `}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <kit.icon className={`h-5 w-5 ${kit.textColor}`} />
            <div className="flex items-center gap-2">
              <span className={`font-bold ${kit.textColor}`}>
                🔧 CLEANUP REVIEW: {kitName}
              </span>
              <span className={`
                px-2 py-1 rounded text-xs font-bold border
                ${kit.statusColor}
              `}>
                {kit.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {componentCount && (
              <span className={kit.textColor}>
                {componentCount} components
              </span>
            )}
            <span className={`${kit.textColor} opacity-75`}>
              {kit.description}
            </span>
            {migrationPath && (
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                → {migrationPath}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}