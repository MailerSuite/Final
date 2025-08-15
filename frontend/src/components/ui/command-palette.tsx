import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Input } from "./input"
import { Badge } from "./badge"
import { ScrollArea } from "./scroll-area"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import {
  MagnifyingGlassIcon,
  CommandLineIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  InboxIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  GlobeAltIcon,
  BoltIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

export interface CommandItem {
  id: string
  title: string
  description?: string
  keywords?: string[]
  icon?: React.ComponentType<{ className?: string }>
  badge?: {
    text: string
    variant?: "default" | "success" | "warning" | "info" | "premium" | "ai" | "live" | "beta" | "pro"
  }
  action: () => void
  section?: string
  shortcut?: string[]
  recent?: boolean
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  placeholder?: string
  items?: CommandItem[]
  recentItems?: CommandItem[]
  className?: string
}

const defaultCommands: CommandItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "View your marketing analytics and metrics",
    icon: ChartBarIcon,
    action: () => { },
    section: "Navigation",
    shortcut: ["⌘", "D"],
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Create and manage email campaigns",
    icon: RocketLaunchIcon,
    action: () => { },
    section: "Navigation",
    shortcut: ["⌘", "C"],
  },
  {
    id: "templates",
    title: "Templates",
    description: "Design email templates",
    icon: DocumentTextIcon,
    action: () => { },
    section: "Navigation",
    shortcut: ["⌘", "T"],
  },
  {
    id: "contacts",
    title: "Contacts",
    description: "Manage your audience",
    icon: UserGroupIcon,
    action: () => { },
    section: "Navigation",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description: "Get AI-powered marketing insights",
    icon: SparklesIcon,
    badge: { text: "AI", variant: "ai" },
    action: () => { },
    section: "AI Tools",
    shortcut: ["⌘", "A"],
  },
  {
    id: "smtp-checker",
    title: "SMTP Checker",
    description: "Test your email server configuration",
    icon: EnvelopeIcon,
    badge: { text: "Live", variant: "live" },
    action: () => { },
    section: "Tools",
  },
  {
    id: "inbox-monitor",
    title: "Inbox Monitor",
    description: "Monitor email delivery rates",
    icon: InboxIcon,
    badge: { text: "Live", variant: "live" },
    action: () => { },
    section: "Tools",
  },
  {
    id: "blacklist-checker",
    title: "Blacklist Checker",
    description: "Check sender reputation",
    icon: ShieldCheckIcon,
    badge: { text: "Pro", variant: "pro" },
    action: () => { },
    section: "Tools",
  },
]

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  placeholder = "Type a command or search...",
  items = defaultCommands,
  recentItems = [],
  className,
}) => {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  // Combine and filter items
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent items first, then all items
      const recent = recentItems.slice(0, 3)
      const regular = items.filter(item => !recent.find(r => r.id === item.id))
      return [...recent, ...regular.slice(0, 8)]
    }

    const lowerQuery = query.toLowerCase()
    return items.filter(item => {
      return (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
        item.section?.toLowerCase().includes(lowerQuery)
      )
    }).slice(0, 10)
  }, [query, items, recentItems])

  // Group items by section
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}

    filteredItems.forEach(item => {
      const section = item.section || "Commands"
      if (!groups[section]) {
        groups[section] = []
      }
      groups[section].push(item)
    })

    return groups
  }, [filteredItems])

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selectedItem = filteredItems[selectedIndex]
        if (selectedItem) {
          selectedItem.action()
          onClose()
        }
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredItems, selectedIndex, onClose])

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleItemClick = (item: CommandItem) => {
    item.action()
    onClose()
  }

  const renderShortcut = (shortcut?: string[]) => {
    if (!shortcut) return null

    return (
      <div className="flex items-center gap-0.5">
        {shortcut.map((key, i) => (
          <kbd
            key={i}
            className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
          >
            {key}
          </kbd>
        ))}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            className={cn(
              "sm:max-w-2xl p-0 overflow-hidden",
              "bg-background/95 backdrop-blur-xl border-border/50",
              className
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="px-4 pt-4 pb-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 border-0 bg-muted/50 focus-visible:ring-1"
                    autoFocus
                  />
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-96 px-2 pb-2">
                {filteredItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CommandLineIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No commands found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(groupedItems).map(([section, sectionItems]) => (
                      <div key={section}>
                        <div className="px-2 py-1">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {section}
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {sectionItems.map((item, itemIndex) => {
                            const globalIndex = filteredItems.indexOf(item)
                            const isSelected = globalIndex === selectedIndex

                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: itemIndex * 0.02 }}
                              >
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start h-auto p-3 rounded-lg",
                                    "hover:bg-accent/50",
                                    isSelected && "bg-accent"
                                  )}
                                  onClick={() => handleItemClick(item)}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    {item.icon && (
                                      <div className="flex-shrink-0">
                                        <item.icon className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}

                                    <div className="flex-1 text-left min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm truncate">
                                          {item.title}
                                        </span>
                                        {item.badge && (
                                          <Badge variant={item.badge.variant} size="sm">
                                            {item.badge.text}
                                          </Badge>
                                        )}
                                        {item.recent && (
                                          <Badge variant="outline" size="sm">
                                            <ClockIcon className="w-3 h-3 mr-1" />
                                            Recent
                                          </Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>

                                    {renderShortcut(item.shortcut)}
                                  </div>
                                </Button>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

// Hook for using command palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const navigate = useNavigate()

  // Global keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const commands: CommandItem[] = React.useMemo(() => [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "View your marketing analytics and metrics",
      icon: ChartBarIcon,
      action: () => navigate("/dashboard"),
      section: "Navigation",
      shortcut: ["⌘", "D"],
    },
    {
      id: "campaigns",
      title: "Campaigns",
      description: "Create and manage email campaigns",
      icon: RocketLaunchIcon,
      action: () => navigate("/campaigns"),
      section: "Navigation",
      shortcut: ["⌘", "C"],
    },
    {
      id: "templates",
      title: "Templates",
      description: "Design email templates",
      icon: DocumentTextIcon,
      action: () => navigate("/templates"),
      section: "Navigation",
      shortcut: ["⌘", "T"],
    },
    {
      id: "contacts",
      title: "Contacts",
      description: "Manage your audience",
      icon: UserGroupIcon,
      action: () => navigate("/contacts"),
      section: "Navigation",
    },
    {
      id: "ai-assistant",
      title: "AI Assistant",
      description: "Get AI-powered marketing insights",
      icon: SparklesIcon,
      badge: { text: "AI", variant: "ai" },
      action: () => navigate("/assistant"),
      section: "AI Tools",
      shortcut: ["⌘", "A"],
    },
  ], [navigate])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
    commands,
  }
}

export default CommandPalette