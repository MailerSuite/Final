import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SparkleEffect } from '@/components/ui/sparkle-effect'
import { Icon } from '@/components/ui/icon'
import { AnimatedLogo } from '@/components/ui/animated-logo'
import { motion } from 'framer-motion'
<<<<<<< Current (Your changes)
import { ChevronLeft, ChevronRight } from 'lucide-react'
=======
import { useAuthStore } from '@/store/auth'
>>>>>>> Incoming (Background Agent changes)

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const baseNavigation = [
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
      { to: '/smtp/checker?tab=bulk', label: 'Bulk SMTP Checker', icon: 'MailCheck' },
      { to: '/smtp-pool', label: 'SMTP Pool', icon: 'Server', badge: 'HOT' },
      { to: '/imap-inbox', label: 'IMAP Inbox', icon: 'Inbox' },
      { to: '/imap/checker?tab=host-config', label: 'IMAP Checker', icon: 'Inbox' },
      { to: '/live-console', label: 'Live Console', icon: 'Terminal' },
      { to: '/blacklist-status', label: 'Blacklist', icon: 'Shield' },
      { to: '/proxies', label: 'Proxies', icon: 'Server' },
      { to: '/proxies/checker', label: 'Proxy Checker', icon: 'ShieldCheck' },
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
  const { userData } = useAuthStore()
  const isAdmin = userData?.is_admin === true

  const sections = React.useMemo(() => {
    const sectionsList = [...baseNavigation]

    // Account section (always visible)
    sectionsList.push({
      title: 'Account',
      items: [
        { to: '/account/profile', label: 'Profile', icon: 'User' },
        { to: '/account/subscription', label: 'Subscription', icon: 'CreditCard' },
        { to: '/account/billing', label: 'Billing', icon: 'FileText' },
      ]
    })

    // Admin section (admins only; shown in dev for easy access)
    if (isAdmin || import.meta.env.DEV) {
      sectionsList.push({
        title: 'Admin',
        items: [
          { to: '/admin', label: 'Admin Dashboard', icon: 'Shield' },
          { to: '/admin/users', label: 'Users', icon: 'Users' },
          { to: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
          { to: '/admin/settings', label: 'Settings', icon: 'Settings' },
        ]
      })
    }

    return sectionsList
  }, [isAdmin])

  const isActive = (path: string) => {
    const destPath = (path || '').split('?')[0]
    return location.pathname === destPath || location.pathname.startsWith(destPath + '/')
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar-background border-r border-sidebar-border relative transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Magical sparkle effect */}
      <SparkleEffect className="z-0" count={15} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border relative z-10">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <AnimatedLogo
              size="md"
              showText={true}
              collapsed={false}
            />
            {onToggle && (
              <motion.button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-primary"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <AnimatedLogo
              size="sm"
              showText={false}
              collapsed={true}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="px-3 py-4 space-y-6">
          {sections.map((section) => (
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
                          active && "bg-sidebar-accent/20 border-l-2 border-sidebar-primary shadow-sm shadow-sidebar-primary/10",
                          !active && "text-sidebar-foreground hover:bg-sidebar-accent",
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
                              active ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary",
                              section.title === 'AI Tools' && "text-secondary"
                            )}
                            ariaLabel={item.label}
                          />
                        </motion.div>
                        {!collapsed && (
                          <>
                            <span className={cn(
                              "ml-3 flex-1 text-sm font-medium",
                              active ? "text-sidebar-foreground font-semibold" : "text-sidebar-foreground"
                            )}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="default"
                                className={cn(
                                  "ml-2 text-[10px] px-1.5 py-0.5",
                                  item.badge === 'AI' && "bg-gradient-to-r from-primary to-secondary text-white border-0",
                                  item.badge === 'NEW' && "bg-secondary text-white border-0",
                                  item.badge === 'HOT' && "bg-primary text-white border-0",
                                  item.badge === 'TEST' && "bg-accent/20 text-accent-foreground border-accent/50",
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
      <div className="p-3 border-t border-sidebar-border relative z-10">
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
                    ? "bg-sidebar-accent/20 text-sidebar-foreground font-semibold shadow-sm shadow-sidebar-primary/10"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon
                  name={item.icon}
                  size="sm"
                  className={cn(
                    "flex-shrink-0",
                    active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
                  )}
<<<<<<< Current (Your changes)
                  ariaLabel={item.label}
                />
                {!collapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
=======
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
                    <span className="flex-1 text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              </div>
>>>>>>> Incoming (Background Agent changes)
            )
          })}
        </nav>

        {/* Expand button when collapsed */}
        {collapsed && onToggle && (
          <motion.button
            onClick={onToggle}
            className="mt-2 p-1.5 rounded-lg transition-colors text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent mx-auto"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  )
}