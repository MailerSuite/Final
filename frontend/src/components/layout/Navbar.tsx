import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Zap,
  Activity,
  Menu
} from 'lucide-react'
import { WorkspaceSelector } from './WorkspaceSelector'

interface NavbarProps {
  onMenuClick?: () => void
  onAIAssistantClick?: () => void
  onSupportClick?: () => void
  className?: string
}

import { Bot, LifeBuoy } from 'lucide-react'

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, onAIAssistantClick, onSupportClick, className }) => {
  const [notifications] = React.useState(3) // Mock notification count

  return (
    <header
      className={cn(
        'w-full h-14 border-b border-sidebar-border',
        'bg-sidebar-background/95 backdrop-blur-xl',
        className
      )}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        background: 'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.08) 50%, rgba(139,92,246,0.1) 100%)'
      }} />
      <div className="relative flex h-full items-center px-4 md:px-6 gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 md:hidden text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Workspace Selector */}
        <div className="hidden md:block">
          <WorkspaceSelector />
        </div>

        {/* Search */}
        <div className="flex-1 max-w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/70" />
            <Input
              placeholder="Search campaigns, templates, contacts..."
              className="pl-10 h-9 bg-sidebar-accent/30 border border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60 focus:bg-sidebar-accent/50 focus:border-sidebar-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors">
              Quick Send
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors">
              New Campaign
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs flex items-center gap-1 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-primary/10 transition-all"
              onClick={onAIAssistantClick}
            >
              <Bot className="h-4 w-4" />
              AI Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs flex items-center gap-1 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors"
              onClick={onSupportClick}
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </Button>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300 text-background border-0"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-sidebar-background/95 backdrop-blur-xl border-sidebar-border">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge className="bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300 text-background border-0">{notifications}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-3 hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="font-medium text-sm">Campaign completed</span>
                  </div>
                  <span className="text-xs text-sidebar-foreground/70">
                    "Summer Sale 2024" sent to 1,234 contacts
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="font-medium text-sm">SMTP issue detected</span>
                  </div>
                  <span className="text-xs text-sidebar-foreground/70">
                    Server smtp-01 showing connection errors
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="font-medium text-sm">System update</span>
                  </div>
                  <span className="text-xs text-sidebar-foreground/70">
                    Platform updated to v2.1.0 successfully
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors">
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-2 gap-2 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20 transition-colors">
                <div className="w-6 h-6 rounded-full bg-sidebar-primary/10 border border-sidebar-primary/20 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.25)]">
                  <User className="h-3 w-3 text-sidebar-primary" />
                </div>
                <span className="hidden md:inline text-sm font-medium">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-sidebar-background/95 backdrop-blur-xl border-sidebar-border">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">Administrator</span>
                  <span className="text-xs text-sidebar-foreground/70">admin@mailersuite.com</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Navbar