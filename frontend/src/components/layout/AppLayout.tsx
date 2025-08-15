import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ApiHealthBanner } from '@/components/banners/ApiHealthBanner'
import { TrialBanner } from '@/components/banners/TrialBanner'
import { AIAssistantPanel } from '@/pages/finalui2/components/AIAssistantPanel'
import { SupportPanel } from '@/pages/finalui2/components/SupportPanel'
import { WorkspaceProvider } from '@/context/WorkspaceContext'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [aiAssistantOpen, setAIAssistantOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Close mobile menu on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Remember sidebar state in localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar - Fixed Position */}
        <div className={cn(
          "hidden md:flex fixed left-0 top-0 h-full z-40 transition-all duration-300",
          sidebarCollapsed ? "w-[60px]" : "w-[240px]"
        )}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 animate-in fade-in-0 duration-300">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={toggleMobileMenu}
            />
            {/* Mobile Sidebar */}
            <div className="relative animate-in slide-in-from-left-full duration-300">
              <Sidebar
                collapsed={false}
                onToggle={toggleMobileMenu}
                className="md:hidden border-r-0 shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Main Content Area - Properly Offset */}
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            'md:pl-[240px]', // Default sidebar width
            sidebarCollapsed && 'md:pl-[60px]' // Collapsed sidebar width
          )}
        >
          {/* Navbar - Full Width within Content Area */}
          <Navbar
            onMenuClick={toggleMobileMenu}
            onAIAssistantClick={() => { setSupportOpen(false); setAIAssistantOpen(true) }}
            onSupportClick={() => { setAIAssistantOpen(false); setSupportOpen(true) }}
            className="sticky top-0 z-30"
          />

          {/* Page Content */}
          <main className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-3.5rem)]"> {/* 3.5rem = navbar height */}
              <div
                className={cn(
                  'container mx-auto p-6 md:p-8 max-w-7xl premium-spacing text-foreground',
                  className
                )}
              >
                <ApiHealthBanner />
                <TrialBanner />
                {children}
              </div>
            </ScrollArea>
          </main>
        </div>
        {/* Right-side AI Assistant Panel */}
        <AIAssistantPanel isOpen={aiAssistantOpen} onClose={() => setAIAssistantOpen(false)} />
        <SupportPanel isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      </div>
    </WorkspaceProvider>
  )
}

export default AppLayout