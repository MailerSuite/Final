/**
 * 🚀 Route Error Boundary - Prevents White Pages
 * Comprehensive error handling for routing failures
 * Provides graceful fallbacks and recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  StreamlinedCard,
  StreamlinedButton,
  streamlinedAnimations
} from '@/components/client/StreamlinedDesignSystem'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowLeft,
  Bug,
  Wifi,
  WifiOff,
  ChevronDown,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  retryCount: number
}

class RouteErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    })

    // Log error for debugging
    console.error('Route Error Boundary caught an error:', error, errorInfo)
    
    // Send error to monitoring service (if available)
    this.logErrorToService(error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to your error tracking service
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount
      }
      
      // Example: Send to error tracking service
      // errorTrackingService.captureException(errorData)
      console.warn('Error logged:', errorData)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    })
  }

  private handleAutoRetry = () => {
    // Auto-retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, delay)
  }

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  private copyErrorDetails = () => {
    const { error, errorInfo } = this.state
    const errorText = [
      `Error: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'No stack trace'}`,
      `Component Stack: ${errorInfo?.componentStack || 'No component stack'}`,
      `URL: ${window.location.href}`,
      `Timestamp: ${new Date().toISOString()}`
    ].join('\n\n')

    navigator.clipboard.writeText(errorText).then(() => {
      // You could show a toast here
      console.log('Error details copied to clipboard')
    })
  }

  private getErrorType = (error: Error | null): string => {
    if (!error) return 'Unknown Error'
    
    if (error.message.includes('ChunkLoadError')) return 'Code Loading Error'
    if (error.message.includes('Loading chunk')) return 'Resource Loading Error'
    if (error.message.includes('NetworkError')) return 'Network Error'
    if (error.message.includes('TypeError')) return 'Component Error'
    if (error.message.includes('ReferenceError')) return 'Reference Error'
    
    return 'Application Error'
  }

  private getErrorSolution = (error: Error | null): string => {
    if (!error) return 'Please try refreshing the page'
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'This usually happens after an app update. Please refresh the page to load the latest version.'
    }
    if (error.message.includes('NetworkError')) {
      return 'Please check your internet connection and try again.'
    }
    if (error.message.includes('TypeError')) {
      return 'There was an issue with the page component. Please try navigating to a different page.'
    }
    
    return 'Please try refreshing the page or contact support if the issue persists.'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.getErrorType(this.state.error)
      const errorSolution = this.getErrorSolution(this.state.error)

      return (
        <div className="error-page-responsive">
          {/* Floating Background Elements - scoped to content area */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="floating-orb opacity-10" />
            <div className="floating-orb opacity-10" />
            <div className="floating-orb floating-orb-3 opacity-10" />
          </div>

          <motion.div
            className="relative z-10 w-full max-w-2xl mx-auto"
            variants={streamlinedAnimations.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StreamlinedCard variant="minimal" padding="lg" className="text-center">
              <motion.div
                className="space-y-6"
                variants={streamlinedAnimations.fadeInUp}
              >
                {/* Error Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                {/* Error Title */}
                <div>
                  <h1 className="text-2xl font-semibold mb-2">
                    {errorType}
                  </h1>
                  <p className="text-muted-foreground">
                    Something went wrong while loading this page
                  </p>
                </div>

                {/* Error Solution */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm">
                    {errorSolution}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <StreamlinedButton
                    variant="default"
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </StreamlinedButton>

                  <Link to="/dashboard">
                    <StreamlinedButton
                      variant="outline"
                      className="flex items-center gap-2 w-full"
                    >
                      <Home className="w-4 h-4" />
                      Go to Dashboard
                    </StreamlinedButton>
                  </Link>

                  <StreamlinedButton
                    variant="ghost"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </StreamlinedButton>
                </div>

                {/* Auto Retry Info */}
                {this.state.retryCount < 3 && (
                  <motion.div
                    className="text-xs text-muted-foreground"
                    variants={streamlinedAnimations.fadeInUp}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Auto-retry in {Math.min(1000 * Math.pow(2, this.state.retryCount), 10000) / 1000}s
                    </div>
                  </motion.div>
                )}

                {/* Technical Details */}
                <div className="border-t border-border dark:border-border/50 pt-4">
                  <StreamlinedButton
                    variant="ghost"
                    size="sm"
                    onClick={this.toggleDetails}
                    className="flex items-center gap-2"
                  >
                    <Bug className="w-4 h-4" />
                    Technical Details
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        this.state.showDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </StreamlinedButton>

                  {this.state.showDetails && (
                    <motion.div
                      className="mt-4 space-y-3"
                      variants={streamlinedAnimations.fadeInUp}
                    >
                      <div className="bg-muted/50 rounded-lg p-4 text-left">
                        <div className="text-xs text-muted-foreground mb-2">
                          Error Message:
                        </div>
                        <div className="text-sm font-mono break-all">
                          {this.state.error?.message || 'No error message available'}
                        </div>
                      </div>

                      {this.state.error?.stack && (
                        <div className="bg-muted/50 rounded-lg p-4 text-left max-h-32 overflow-y-auto">
                          <div className="text-xs text-muted-foreground mb-2">
                            Stack Trace:
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <StreamlinedButton
                          variant="outline"
                          size="sm"
                          onClick={this.copyErrorDetails}
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Details
                        </StreamlinedButton>

                        <a
                          href={`mailto:support@sgpt.com?subject=Route Error Report&body=${encodeURIComponent(
                            `Error Type: ${errorType}\nURL: ${window.location.href}\nMessage: ${this.state.error?.message || 'Unknown'}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <StreamlinedButton
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Report Issue
                          </StreamlinedButton>
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Help Links */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Need help? Check our:</div>
                  <div className="flex justify-center gap-4">
                    <Link to="/status" className="hover:text-primary transition-colors">
                      System Status
                    </Link>
                    <Link to="/contact" className="hover:text-primary transition-colors">
                      Contact Support
                    </Link>
                    <a
                      href="https://docs.sgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      Documentation
                    </a>
                  </div>
                </div>
              </motion.div>
            </StreamlinedCard>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Quick Error Fallback Component
export function QuickErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void 
}) {
  return (
    <StreamlinedCard variant="minimal" padding="md" className="m-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="font-medium">Component Error</h3>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Something went wrong with this component'}
          </p>
        </div>
        <StreamlinedButton
          variant="outline"
          size="sm"
          onClick={resetError}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </StreamlinedButton>
      </div>
    </StreamlinedCard>
  )
}

// Network Error Fallback
export function NetworkErrorFallback() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <StreamlinedCard variant="minimal" padding="md" className="m-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {isOnline ? (
            <Wifi className="w-8 h-8 text-green-500" />
          ) : (
            <WifiOff className="w-8 h-8 text-red-500" />
          )}
        </div>
        <div>
          <h3 className="font-medium">
            {isOnline ? 'Connection Restored' : 'No Internet Connection'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isOnline 
              ? 'Your connection has been restored. Please try again.'
              : 'Please check your internet connection and try again.'
            }
          </p>
        </div>
        {isOnline && (
          <StreamlinedButton
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </StreamlinedButton>
        )}
      </div>
    </StreamlinedCard>
  )
}

export default RouteErrorBoundary