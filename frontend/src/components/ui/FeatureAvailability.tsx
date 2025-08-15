import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Construction, ExternalLink, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'

interface FeatureAvailabilityProps {
  children: React.ReactNode
  feature: string
  checkEndpoint?: string
  fallbackMessage?: string
  comingSoon?: boolean
  externalUrl?: string
}

export function FeatureAvailability({ 
  children, 
  feature,
  checkEndpoint,
  fallbackMessage,
  comingSoon = false,
  externalUrl
}: FeatureAvailabilityProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (checkEndpoint) {
      setIsChecking(true)
      fetch(checkEndpoint)
        .then(response => {
          setIsAvailable(response.status !== 404)
        })
        .catch(() => {
          setIsAvailable(false)
        })
        .finally(() => {
          setIsChecking(false)
        })
    } else {
      setIsAvailable(true)
    }
  }, [checkEndpoint])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
        />
        <span className="ml-3 text-muted-foreground">Checking feature availability...</span>
      </div>
    )
  }

  if (isAvailable === false) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[400px] p-6"
      >
        <Card className="neon-glow border border-orange-500/30 bg-orange-900/10 max-w-md w-full">
          <CardHeader className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              {comingSoon ? (
                <Construction className="h-12 w-12 text-orange-500" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-orange-500" />
              )}
            </motion.div>
            <CardTitle className="text-xl font-bold text-orange-400">
              {comingSoon ? 'Feature Coming Soon' : 'Feature Unavailable'}
            </CardTitle>
            <div className="flex justify-center mt-2">
              <Badge variant="secondary" aria-label={`Feature: ${feature}`}>
                {feature}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {fallbackMessage || (comingSoon 
                ? `The ${feature} feature is currently under development and will be available soon.`
                : `The ${feature} feature is not available on this server instance.`
              )}
            </p>
            
            {externalUrl && (
              <div className="space-y-3">
                <p className="text-sm text-orange-300">
                  You can access this feature on our main platform:
                </p>
                <Button 
                  onClick={() => window.open(externalUrl, '_blank')}
                  className="bg-accent hover:bg-accent/90 text-black font-medium w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open External Platform
                </Button>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-orange-900/20 rounded-lg border border-orange-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-orange-400 mb-1">
                    {comingSoon ? 'Development Status' : 'Server Configuration'}
                  </h4>
                  <p className="text-xs text-orange-300">
                    {comingSoon 
                      ? 'This feature is being actively developed. Check back soon for updates.'
                      : 'This feature may require additional server configuration or may not be enabled on this instance.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return <>{children}</>
}

// Hook for checking feature availability
export function useFeatureAvailability(endpoint: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkAvailability = React.useCallback(async () => {
    setIsChecking(true)
    try {
      const response = await fetch(endpoint)
      setIsAvailable(response.status !== 404)
    } catch {
      setIsAvailable(false)
    } finally {
      setIsChecking(false)
    }
  }, [endpoint])

  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  return { isAvailable, isChecking, recheckAvailability: checkAvailability }
}

// Component for gracefully hiding unavailable sidebar items
interface ConditionalSidebarItemProps {
  endpoint: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ConditionalSidebarItem({ endpoint, children, fallback }: ConditionalSidebarItemProps) {
  const { isAvailable, isChecking } = useFeatureAvailability(endpoint)

  if (isChecking) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground animate-pulse">
        <div className="w-5 h-5 bg-muted rounded"></div>
        <div className="w-24 h-4 bg-muted rounded"></div>
      </div>
    )
  }

  if (isAvailable === false) {
    return fallback || null
  }

  return <>{children}</>
} 