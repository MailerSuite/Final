import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SparkleEffect, GlowingIcon } from '@/components/ui/sparkle-effect'
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
      "flex flex-col h-full sidebar-wizard relative transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Magical sparkle effect */}
      <SparkleEffect className="z-0" count={15} />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-wizard-border/30 relative z-10">
        <div className="flex items-center space-x-3">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <GlowingIcon color="blue" size="md">
                <div className="w-8 h-8 bg-wizard-gradient rounded-lg flex items-center justify-center">
                  <Icon name="Mail" size="sm" className="text-white" ariaLabel="MailerSuite" />
                </div>
              </GlowingIcon>
              <span className="text-lg font-bold text-wizard-gradient wizard-shimmer">MailerSuite</span>
            </div>
          )}
          {onToggle && !collapsed && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-wizard-primary-accent/20 transition-colors text-wizard-text hover:text-wizard-primary-accent z-10"
            >
              <Icon name="ChevronLeft" size="sm" ariaLabel="Collapse sidebar" />
            </button>
          )}
        </div>
        
        {collapsed && (
          <GlowingIcon color="blue" size="sm" className="mx-auto">
            <div className="w-8 h-8 bg-wizard-gradient rounded-lg flex items-center justify-center">
              <Icon name="Mail" size="sm" className="text-white" ariaLabel="MailerSuite" />
            </div>
          </GlowingIcon>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="px-3 py-4 space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h2 className="px-3 mb-2 text-xs font-semibold tracking-wider text-wizard-text/60 uppercase">
                  {section.title}
                </h2>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <motion.div
                      key={item.to}
                      initial={false}
                      animate={{
                        backgroundColor: active ? 'rgba(58, 175, 255, 0.1)' : 'transparent',
                      }}
                      transition={{
                        duration: 0.25,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ x: 5, scale: 1.02 }}
                    >
                      <Link
                        to={item.to}
                        className={cn(
                          "sidebar-nav-item group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all relative",
                          active && "bg-wizard-gradient-subtle border-l-2 border-wizard-primary-accent wizard-glow-sm",
                          !active && "text-wizard-text hover:bg-wizard-primary-accent/10",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <motion.div
                          initial={false}
                          animate={{ rotate: active ? 360 : 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          <Icon
                            name={item.icon}
                            size="sm"
                            className={cn(
                              "flex-shrink-0",
                              active ? "text-wizard-primary-accent" : "text-wizard-text/70 group-hover:text-wizard-primary-accent",
                              item.title === 'AI Tools' && "text-wizard-secondary-accent"
                            )}
                            ariaLabel={item.label}
                          />
                        </motion.div>
                        {!collapsed && (
                          <>
                            <span className={cn(
                              "ml-3 flex-1 text-sm font-medium",
                              active ? "text-wizard-heading" : "text-wizard-text"
                            )}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="default"
                                className={cn(
                                  "ml-2 text-[10px] px-1.5 py-0.5",
                                  item.badge === 'AI' && "bg-wizard-gradient text-white border-0",
                                  item.badge === 'NEW' && "bg-wizard-secondary-accent text-white border-0",
                                  item.badge === 'HOT' && "bg-wizard-primary-accent text-white border-0",
                                  item.badge === 'TEST' && "bg-wizard-gradient-subtle text-wizard-primary-accent border-wizard-primary-accent/50",
                                  item.badge === '$2000' && "bg-green-500 text-white border-0"
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
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
      <div className="p-3 border-t border-wizard-border/30 relative z-10">
        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-wizard-gradient-subtle text-wizard-heading wizard-glow-sm"
                    : "text-wizard-text hover:bg-wizard-primary-accent/10 hover:text-wizard-primary-accent",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon
                  name={item.icon}
                  size="sm"
                  className={cn(
                    "flex-shrink-0",
                    active ? "text-wizard-primary-accent" : "text-wizard-text/70"
                  )}
                  ariaLabel={item.label}
                />
                {!collapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Expand button for mobile when collapsed */}
        {collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="absolute top-5 right-2 p-1.5 rounded-lg transition-colors text-wizard-text hover:text-wizard-primary-accent hover:bg-wizard-primary-accent/20 wizard-glow-sm md:hidden"
          >
            <Icon name="Menu" size="sm" ariaLabel="Expand sidebar" />
          </button>
        )}
      </div>
    </div>
  )
}