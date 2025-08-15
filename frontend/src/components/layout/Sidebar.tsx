import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SparkleEffect, GlowingIcon } from '@/components/ui/sparkle-effect'
import {
  HomeIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  UsersIcon,
  CommandLineIcon,
  EnvelopeIcon,
  InboxIcon,
  ShieldCheckIcon,
  ServerIcon,
  ServerStackIcon,
  CloudIcon,
  GlobeAltIcon,
  BoltIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  SparklesIcon,
  CpuChipIcon,
  BeakerIcon,
  Bars3Icon,
  PaintBrushIcon,
  PresentationChartLineIcon,
  CursorArrowRaysIcon,
  Squares2X2Icon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const navigation = [
  {
    title: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
      { to: '/campaigns', label: 'Campaigns', icon: RocketLaunchIcon },
      { to: '/templates', label: 'Templates', icon: DocumentTextIcon },
      { to: '/contacts', label: 'Contacts', icon: UsersIcon },
      { to: '/lead-bases', label: 'Lead Bases', icon: Squares2X2Icon },
      { to: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    ]
  },
  {
    title: 'AI Tools',
    items: [
      { to: '/ai-tutor', label: 'AI Spam Tutor', icon: AcademicCapIcon, badge: '$2000' },
      { to: '/assistant', label: 'AI Assistant', icon: CommandLineIcon, badge: 'AI' },
      { to: '/content-generator', label: 'Content Generator', icon: SparklesIcon, badge: 'AI' },
      { to: '/email-optimizer', label: 'Email Optimizer', icon: CpuChipIcon, badge: 'AI' },
      { to: '/analytics-dashboard', label: 'AI Analytics', icon: PresentationChartLineIcon, badge: 'AI' },
      { to: '/lead-scorer', label: 'Lead Scorer', icon: CursorArrowRaysIcon, badge: 'AI' },
      { to: '/content-personalizer', label: 'Personalizer', icon: PaintBrushIcon, badge: 'AI' },
    ]
  },
  {
    title: 'Tools',
    items: [
      { to: '/smtp-checker', label: 'SMTP Checker', icon: EnvelopeIcon },
      { to: '/smtp-pool', label: 'SMTP Pool', icon: ServerStackIcon, badge: 'HOT' },
      { to: '/imap-inbox', label: 'IMAP Inbox', icon: InboxIcon },
      { to: '/live-console', label: 'Live Console', icon: CommandLineIcon },
      { to: '/blacklist-status', label: 'Blacklist', icon: ShieldCheckIcon },
      { to: '/proxies', label: 'Proxies', icon: ServerIcon },
      { to: '/proxy-pool', label: 'Proxy Pool', icon: CloudIcon, badge: 'HOT' },
      { to: '/domains', label: 'Domains', icon: GlobeAltIcon },
      { to: '/performance', label: 'Performance', icon: BoltIcon },
      { to: '/playground', label: 'Playground', icon: BeakerIcon, badge: 'NEW' },
      { to: '/workspace-test', label: 'Workspace Test', icon: BriefcaseIcon, badge: 'TEST' },
    ]
  }
]

const bottomItems = [
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  { to: '/help', label: 'Help & Support', icon: QuestionMarkCircleIcon },
]

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggle,
  className
}) => {
  const location = useLocation()
  const [shouldAnimate, setShouldAnimate] = useState(true)
  const [animationKey, setAnimationKey] = useState(0)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }


  // Handle initial page load and route changes
  useEffect(() => {
    setShouldAnimate(true)
    setAnimationKey(prev => prev + 1)
    
    // Stop animation after completion
    const timer = setTimeout(() => setShouldAnimate(false), 3000)
    
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className={cn(
      "flex flex-col h-screen sidebar-wizard relative",
      collapsed ? "w-[60px]" : "w-[240px]",
      "transition-all duration-300",
      className
    )}>
      {/* Magical sparkle effect */}
      <SparkleEffect className="z-0" count={15} />
      
      {/* Header - Match navbar height */}
      <div className="h-14 flex items-center border-b border-wizard-border/30 relative overflow-hidden z-10">
        {/* Animated Background Layers - Dark cyberpunk theme */}
        <div className="absolute inset-0" key={`bg-${animationKey}`}>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-sidebar-accent/20 via-sidebar-primary/15 to-sidebar-accent/20",
            shouldAnimate && "animate-gradient-x"
          )} />
          <div className={cn(
            "absolute inset-0 bg-gradient-to-l from-sidebar-accent/10 via-transparent to-sidebar-primary/8",
            shouldAnimate && "animate-gradient-y"
          )} />
          {/* Scanlines effect */}
          <div className="absolute inset-0 opacity-8" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(var(--sidebar-primary), 0.08) 2px,
              rgba(var(--sidebar-primary), 0.08) 4px
            )`
          }} />
        </div>
        
        <div className="relative w-full px-4 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              {/* Dashboard-Style Logo with Sword Effect */}
              <div className="relative group cursor-pointer" key={`logo-${animationKey}`}>
                {/* Sophisticated glow system */}
                <div className="absolute inset-0">
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-sidebar-primary/30 via-sidebar-accent/40 to-sidebar-primary/30 rounded-xl blur-lg",
                    shouldAnimate && "animate-pulse-slow"
                  )} />
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-sidebar-primary/20 to-sidebar-accent/20 rounded-xl blur-xl",
                    shouldAnimate && "animate-pulse-slow animation-delay-500"
                  )} />
                </div>
                
                {/* Logo container - dashboard style */}
                <div className="relative w-11 h-11 bg-gradient-to-br from-sidebar-background via-sidebar-background to-sidebar-background rounded-xl border border-sidebar-border backdrop-blur-sm group-hover:scale-105 transition-all duration-300 shadow-lg shadow-sidebar-primary/20">
                  {/* Inner border glow */}
                  <div className="absolute inset-0.5 rounded-lg bg-gradient-to-br from-sidebar-primary/10 to-sidebar-accent/10" />
                  
                  {/* Sword-like element */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Sword blade effect */}
                      <div className={cn(
                        "absolute -top-1 left-1/2 w-0.5 h-6 bg-gradient-to-t from-sidebar-primary via-sidebar-primary-foreground to-white transform -translate-x-1/2 opacity-80",
                        shouldAnimate && "animate-logo-3d"
                      )} />
                      
                      {/* Letter S with sword styling */}
                      <span className={cn(
                        "text-xl font-black bg-gradient-to-br from-sidebar-primary via-sidebar-primary to-sidebar-accent bg-clip-text text-transparent drop-shadow-lg relative z-10",
                        shouldAnimate && "animate-text-glow"
                      )}>
                        S
                      </span>
                      
                      {/* Sword hilt/crossguard */}
                      <div className={cn(
                        "absolute bottom-0 left-1/2 w-3 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transform -translate-x-1/2 rounded-full shadow-lg shadow-yellow-400/50",
                        shouldAnimate && "animate-domain-pulse"
                      )} />
                    </div>
                  </div>
                  
                  {/* Corner accent dots */}
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-sidebar-primary/60 rounded-full" />
                  <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-sidebar-primary/60 rounded-full" />
                </div>
              </div>
              
              {/* Brand Text - Dashboard Style */}
              <div className="flex items-center" key={`text-${animationKey}`}>
                <span className={cn(
                  "font-black text-wizard-gradient text-xl tracking-tight wizard-shimmer",
                  shouldAnimate && "animate-pulse-glow"
                )}>
                  SGPT
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="relative group mx-auto cursor-pointer" key={`collapsed-logo-${animationKey}`}>
              {/* Sophisticated glow system */}
              <div className="absolute inset-0">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-blue-500/30 via-indigo-500/40 to-purple-500/30 rounded-xl blur-lg",
                  shouldAnimate && "animate-pulse-slow"
                )} />
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-xl blur-xl",
                  shouldAnimate && "animate-pulse-slow animation-delay-500"
                )} />
              </div>
              
              {/* Logo container - dashboard style */}
              <div className="relative w-11 h-11 bg-gradient-to-br from-blue-900/80 via-blue-950/90 to-indigo-950/95 rounded-xl border border-blue-500/30 backdrop-blur-sm group-hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20">
                <div className="absolute inset-0.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Sword blade effect */}
                    <div className={cn(
                      "absolute -top-1 left-1/2 w-0.5 h-6 bg-gradient-to-t from-blue-400 via-cyan-300 to-white transform -translate-x-1/2 opacity-80",
                      shouldAnimate && "animate-logo-3d"
                    )} />
                    
                    {/* Letter S with sword styling */}
                    <span className={cn(
                      "text-xl font-black bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-lg relative z-10",
                      shouldAnimate && "animate-text-glow"
                    )}>
                      S
                    </span>
                    
                    {/* Sword hilt/crossguard */}
                    <div className={cn(
                      "absolute bottom-0 left-1/2 w-3 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 transform -translate-x-1/2 rounded-full shadow-lg shadow-yellow-400/50",
                      shouldAnimate && "animate-domain-pulse"
                    )} />
                  </div>
                </div>
                
                {/* Corner accent dots */}
                <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-cyan-400/60 rounded-full" />
                <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-blue-400/60 rounded-full" />
              </div>
            </div>
          )}
          {onToggle && !collapsed && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-primary-foreground z-10"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="px-3 py-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h2 className="px-3 mb-2 text-xs font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
                  {section.title}
                </h2>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        // Trigger animation on navigation
                        setShouldAnimate(true)
                        setAnimationKey(prev => prev + 1)
                        
                        // Stop animation after completion
                        setTimeout(() => setShouldAnimate(false), 3000)
                      }}
                      className={cn(
                        "sidebar-nav-item group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all relative",
                        active && "active bg-wizard-gradient-subtle border-l-2 border-wizard-primary-accent wizard-glow-sm",
                        !active && "text-wizard-text hover:bg-wizard-primary-accent/10",
                        collapsed && "justify-center px-2"
                      )}
                      data-active={active ? 'true' : undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0 w-5 h-5 transition-colors",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary",
                        !collapsed && "mr-3"
                      )} />
                      {!collapsed && (
                        <span className="flex-1 text-sm font-medium text-sidebar-foreground">
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-auto text-xs px-1.5 py-0",
                            active ? "border-sidebar-primary text-sidebar-primary" : "border-sidebar-border text-sidebar-foreground/60"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-3 border-t border-sidebar-border">
        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  // Trigger animation on navigation
                  setShouldAnimate(true)
                  setAnimationKey(prev => prev + 1)
                  
                  // Stop animation after completion
                  setTimeout(() => setShouldAnimate(false), 3000)
                }}
                className={cn(
                  "sidebar-nav-item group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all",
                  active && "active shadow-glow",
                  !active && "text-secondary",
                  collapsed && "justify-center px-2"
                )}
                data-active={active ? 'true' : undefined}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className={cn(
                  "flex-shrink-0 w-5 h-5 transition-colors",
                  active ? "text-accent" : "text-tertiary group-hover:text-primary",
                  !collapsed && "mr-3"
                )} />
                {!collapsed && (
                  <span className="text-sm font-medium text-sidebar-foreground">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile Toggle */}
      {onToggle && collapsed && (
        <button
          onClick={onToggle}
          className="absolute top-5 right-2 p-1.5 rounded-lg transition-colors text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 md:hidden"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default Sidebar