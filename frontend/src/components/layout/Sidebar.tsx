import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Icon } from '@/components/ui/icon'
import { motion } from 'framer-motion'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const navigation = [
  {
    title: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'Home' },
      { to: '/campaigns', label: 'Campaigns', icon: 'Rocket' },
      { to: '/templates', label: 'Templates', icon: 'FileText' },
      { to: '/contacts', label: 'Contacts', icon: 'Users' },
      { to: '/lead-bases', label: 'Lead Bases', icon: 'Grid' },
      { to: '/analytics', label: 'Analytics', icon: 'BarChart3' },
    ]
  },
  {
    title: 'AI Tools',
    items: [
      { to: '/ai-tutor', label: 'AI Spam Tutor', icon: 'GraduationCap', badge: '$2000' },
      { to: '/assistant', label: 'AI Assistant', icon: 'Terminal', badge: 'AI' },
      { to: '/content-generator', label: 'Content Generator', icon: 'Sparkles', badge: 'AI' },
      { to: '/email-optimizer', label: 'Email Optimizer', icon: 'Cpu', badge: 'AI' },
      { to: '/analytics-dashboard', label: 'AI Analytics', icon: 'TrendingUp', badge: 'AI' },
      { to: '/lead-scorer', label: 'Lead Scorer', icon: 'Target', badge: 'AI' },
      { to: '/content-personalizer', label: 'Personalizer', icon: 'Palette', badge: 'AI' },
    ]
  },
  {
    title: 'Tools',
    items: [
      { to: '/smtp-checker', label: 'SMTP Checker', icon: 'Mail' },
      { to: '/smtp-pool', label: 'SMTP Pool', icon: 'Server', badge: 'HOT' },
      { to: '/imap-inbox', label: 'IMAP Inbox', icon: 'Inbox' },
      { to: '/live-console', label: 'Live Console', icon: 'Terminal' },
      { to: '/blacklist-status', label: 'Blacklist', icon: 'Shield' },
      { to: '/proxies', label: 'Proxies', icon: 'Server' },
      { to: '/proxy-pool', label: 'Proxy Pool', icon: 'Cloud', badge: 'HOT' },
      { to: '/domains', label: 'Domains', icon: 'Globe' },
      { to: '/performance', label: 'Performance', icon: 'Zap' },
      { to: '/playground', label: 'Playground', icon: 'FlaskConical', badge: 'NEW' },
      { to: '/workspace-test', label: 'Workspace Test', icon: 'Briefcase', badge: 'TEST' },
      { to: '/animation-demo', label: 'Animation Demo', icon: 'Sparkles', badge: 'NEW' },
    ]
  }
]

const bottomItems = [
  { to: '/settings', label: 'Settings', icon: 'Settings' },
  { to: '/help', label: 'Help & Support', icon: 'HelpCircle' },
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
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Icon name="Mail" size="sm" className="text-white" ariaLabel="MailerSuite" />
              </div>
              <span className="text-lg font-bold text-sidebar-primary">MailerSuite</span>
            </div>
          )}
          {onToggle && !collapsed && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-primary-foreground z-10"
            >
              <Icon name="ChevronLeft" size="sm" ariaLabel="Collapse sidebar" />
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
                {section.items.map((item, index) => {
                  const active = isActive(item.to)
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.25,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ x: 5, scale: 1.02 }}
                    >
                      <Link
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
                          !active && "text-sidebar-foreground",
                          collapsed && "justify-center px-2"
                        )}
                        data-active={active ? 'true' : undefined}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon
                          name={item.icon as any}
                          size="base"
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            active ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary",
                            !collapsed && "mr-3"
                          )}
                          ariaLabel={item.label}
                        />
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
                    </motion.div>
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
          {bottomItems.map((item, index) => {
            const active = isActive(item.to)
            return (
              <div key={item.to}>
                <Link
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
                  <Icon
                    name={item.icon as any}
                    size="base"
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      active ? "text-accent" : "text-tertiary group-hover:text-primary",
                      !collapsed && "mr-3"
                    )}
                    ariaLabel={item.label}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium text-sidebar-foreground">{item.label}</span>
                  )}
                </Link>
              </div>
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
          <Icon name="Menu" size="base" ariaLabel="Toggle sidebar" />
        </button>
      )}
    </div>
  )
}

export default Sidebar