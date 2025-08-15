import React, { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  isExpanded: boolean
}

interface GlobalErrorBoundaryProps {
  children: ReactNode
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExpanded: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    
    // Log error to console or external service
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  toggleExpanded = () => {
    this.setState(prev => ({ isExpanded: !prev.isExpanded }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page-responsive">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <Card className="neon-glow border border-red-500/30 bg-red-900/10">
              <CardHeader className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="flex justify-center mb-4"
                >
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-red-400">
                  Application Error
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Something went wrong while loading the application. This error has been logged.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={this.handleRefresh}
                    className="bg-accent hover:bg-accent/90 text-black font-medium"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent/10"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
                
                {this.state.error && (
                  <div className="border border-red-500/30 rounded-lg p-4 bg-red-900/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.toggleExpanded}
                      className="w-full flex items-center justify-between text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    >
                      <span>Technical Details</span>
                      {this.state.isExpanded ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    
                    <motion.div
                      initial={false}
                      animate={{ height: this.state.isExpanded ? 'auto' : 0, opacity: this.state.isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        <div>
                          <h4 className="text-sm font-medium text-red-400 mb-1">Error Message:</h4>
                          <code className="text-xs bg-red-950/50 p-2 rounded block text-red-300 break-words">
                            {this.state.error.message}
                          </code>
                        </div>
                        
                        {this.state.error.stack && (
                          <div>
                            <h4 className="text-sm font-medium text-red-400 mb-1">Stack Trace:</h4>
                            <pre className="text-xs bg-red-950/50 p-2 rounded text-red-300 overflow-auto max-h-40 break-words whitespace-pre-wrap">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                        
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <h4 className="text-sm font-medium text-red-400 mb-1">Component Stack:</h4>
                            <pre className="text-xs bg-red-950/50 p-2 rounded text-red-300 overflow-auto max-h-40 break-words whitespace-pre-wrap">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Centralized Error Alert Component for API/Network errors
interface CentralizedErrorAlertProps {
  error: string | null
  isVisible: boolean
  onDismiss: () => void
  technicalDetails?: string
  title?: string
}

export function CentralizedErrorAlert({ 
  error, 
  isVisible, 
  onDismiss, 
  technicalDetails,
  title = "Error"
}: CentralizedErrorAlertProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (!isVisible || !error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md mx-4"
    >
      <Card className="neon-glow border border-red-500/30 bg-red-900/20 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-400 text-lg">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-300">{error}</p>
          
          {technicalDetails && (
            <div className="border border-red-500/30 rounded-lg p-3 bg-red-950/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2"
              >
                <span className="text-xs">Technical Details</span>
                {isExpanded ? 
                  <ChevronUp className="h-3 w-3" /> : 
                  <ChevronDown className="h-3 w-3" />
                }
              </Button>
              
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <pre className="text-xs bg-red-950/50 p-2 rounded mt-2 text-red-300 overflow-auto max-h-32 break-words whitespace-pre-wrap">
                  {technicalDetails}
                </pre>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Hook for managing centralized errors
export function useCentralizedError() {
  const [error, setError] = React.useState<string | null>(null)
  const [technicalDetails, setTechnicalDetails] = React.useState<string | undefined>(undefined)
  const [isVisible, setIsVisible] = React.useState(false)

  const showError = React.useCallback((message: string, details?: string) => {
    setError(message)
    setTechnicalDetails(details)
    setIsVisible(true)
  }, [])

  const hideError = React.useCallback(() => {
    setError(null)
    setTechnicalDetails(undefined)
    setIsVisible(false)
  }, [])

  return {
    error,
    technicalDetails,
    isVisible,
    showError,
    hideError,
  }
} 