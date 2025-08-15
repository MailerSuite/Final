import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface TokenExpiryHandlerProps {
  children: React.ReactNode
}

export function TokenExpiryHandler({ children }: TokenExpiryHandlerProps) {
  const [isTokenExpired, setIsTokenExpired] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Listen for 401 responses globally
    const handleUnauthorized = (event: CustomEvent) => {
      if (event.detail?.status === 401) {
        setIsTokenExpired(true)
      }
    }

    // Listen for fetch responses
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401) {
        setIsTokenExpired(true)
      }
      return response
    }

    // Listen for axios responses (if axios is configured to dispatch events)
    window.addEventListener('unauthorized', handleUnauthorized as EventListener)

    return () => {
      window.fetch = originalFetch
      window.removeEventListener('unauthorized', handleUnauthorized as EventListener)
    }
  }, [])

  const handleLogin = () => {
    setIsLoggingOut(true)
    // Clear token from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Redirect to login
    window.location.href = '/auth/login'
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isTokenExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="neon-glow border border-yellow-500/30 bg-yellow-900/10">
            <CardHeader className="text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex justify-center mb-4"
              >
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              </motion.div>
              <CardTitle className="text-xl font-bold text-yellow-400">
                Session Expired
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Your session has expired for security reasons. Please log in again to continue.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleLogin}
                  disabled={isLoggingOut}
                  className="bg-accent hover:bg-accent/90 text-black font-medium w-full"
                >
                  {isLoggingOut ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Log In Again
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground mt-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                <p>
                  <strong>Why did this happen?</strong><br />
                  Sessions expire automatically after a period of inactivity to protect your account security.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook to manually trigger token expiry
export function useTokenExpiry() {
  const [isExpired, setIsExpired] = useState(false)

  const triggerExpiry = () => {
    setIsExpired(true)
    // Dispatch custom event for global handling
    window.dispatchEvent(new CustomEvent('unauthorized', { detail: { status: 401 } }))
  }

  return { isExpired, triggerExpiry }
} 