import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { errorHandler, ApplicationError, ErrorCategory, ErrorSeverity } from '../../core/error-system'
import { cn } from '../../lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean // If true, only affects this component tree
  showDetails?: boolean
  className?: string
}

interface State {
  hasError: boolean
  error: ApplicationError | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  errorCount: number
  lastErrorTime: number
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: props.showDetails || false,
      errorCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = errorHandler.parseError(error)
    
    return {
      hasError: true,
      error: appError,
      errorCount: 0, // Will be updated in componentDidCatch
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.state.error || errorHandler.parseError(error)
    
    // Track error frequency
    const now = Date.now()
    const timeSinceLastError = now - this.state.lastErrorTime
    const errorCount = timeSinceLastError < 5000 ? this.state.errorCount + 1 : 1

    // Update state
    this.setState({
      errorInfo,
      errorCount,
      lastErrorTime: now
    })

    // Log to error handler
    errorHandler.handleError(appError)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Auto-reset after multiple errors (possible infinite loop)
    if (errorCount >= 3) {
      this.scheduleReset(10000) // Reset after 10 seconds
    }
  }

  scheduleReset = (delay: number) => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = setTimeout(() => {
      this.handleReset()
    }, delay)
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  renderErrorDetails = () => {
    const { error, errorInfo, showDetails } = this.state

    if (!showDetails || !error) return null

    return (
      <div className="mt-4 space-y-4">
        <div className="bg-muted dark:bg-background p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Error Details</h4>
          <dl className="text-xs space-y-1">
            <div className="flex">
              <dt className="font-medium w-24">ID:</dt>
              <dd className="text-muted-foreground dark:text-muted-foreground">{error.errorId}</dd>
            </div>
            <div className="flex">
              <dt className="font-medium w-24">Code:</dt>
              <dd className="text-muted-foreground dark:text-muted-foreground">{error.code}</dd>
            </div>
            <div className="flex">
              <dt className="font-medium w-24">Category:</dt>
              <dd className="text-muted-foreground dark:text-muted-foreground">{error.category}</dd>
            </div>
            <div className="flex">
              <dt className="font-medium w-24">Severity:</dt>
              <dd className="text-muted-foreground dark:text-muted-foreground">{error.severity}</dd>
            </div>
            {error.statusCode && (
              <div className="flex">
                <dt className="font-medium w-24">Status:</dt>
                <dd className="text-muted-foreground dark:text-muted-foreground">{error.statusCode}</dd>
              </div>
            )}
          </dl>
        </div>

        {error.details && error.details.length > 0 && (
          <div className="bg-muted dark:bg-background p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Additional Information</h4>
            <ul className="text-xs space-y-1">
              {error.details.map((detail, idx) => (
                <li key={idx} className="text-muted-foreground dark:text-muted-foreground">
                  {detail.field && <span className="font-medium">{detail.field}: </span>}
                  {detail.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorInfo && (
          <div className="bg-muted dark:bg-background p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Component Stack</h4>
            <pre className="text-xs text-muted-foreground dark:text-muted-foreground overflow-x-auto">
              {errorInfo.componentStack}
            </pre>
          </div>
        )}

        {import.meta.env.DEV && error.stack && (
          <div className="bg-muted dark:bg-background p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Stack Trace</h4>
            <pre className="text-xs text-muted-foreground dark:text-muted-foreground overflow-x-auto">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    )
  }

  renderCompactError = () => {
    const { error } = this.state

    return (
      <Alert variant="destructive" className={this.props.className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {error?.getUserFriendlyMessage() || 'An unexpected error occurred'}
        </AlertDescription>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </div>
      </Alert>
    )
  }

  renderFullError = () => {
    const { error, errorCount, showDetails } = this.state

    const getSeverityColor = () => {
      switch (error?.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          return 'border-red-500 dark:border-red-600'
        case ErrorSeverity.MEDIUM:
          return 'border-orange-500 dark:border-orange-600'
        default:
          return 'border-yellow-500 dark:border-yellow-600'
      }
    }

    return (
      <div className={cn("min-h-[400px] flex items-center justify-center p-4", this.props.className)}>
        <Card className={cn("max-w-2xl w-full", getSeverityColor())}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">
                  {error?.category === ErrorCategory.NETWORK 
                    ? 'Connection Problem'
                    : error?.category === ErrorCategory.SERVER
                    ? 'Server Error'
                    : 'Something went wrong'
                  }
                </CardTitle>
                <CardDescription className="mt-1">
                  {error?.getUserFriendlyMessage() || 'An unexpected error occurred while loading this page'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Recovery suggestions */}
            {error?.recoveryActions && error.recoveryActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested actions:</p>
                <div className="flex flex-wrap gap-2">
                  {error.recoveryActions.map((action, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant={idx === 0 ? "default" : "outline"}
                      onClick={() => action.action?.()}
                    >
                      {action.type === 'retry' && <RefreshCw className="h-4 w-4 mr-1" />}
                      {action.type === 'redirect' && <Home className="h-4 w-4 mr-1" />}
                      {action.type === 'contact_support' && <Mail className="h-4 w-4 mr-1" />}
                      {action.description}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Default actions */}
            {(!error?.recoveryActions || error.recoveryActions.length === 0) && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                >
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            )}

            {/* Error frequency warning */}
            {errorCount >= 2 && (
              <Alert variant="warning">
                <AlertDescription>
                  This error has occurred {errorCount} times. The page may automatically reset soon.
                </AlertDescription>
              </Alert>
            )}

            {/* Details toggle */}
            <button
              onClick={this.toggleDetails}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show details
                </>
              )}
            </button>

            {/* Error details */}
            {this.renderErrorDetails()}
          </CardContent>
        </Card>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Use compact view if isolated
      if (this.props.isolate) {
        return this.renderCompactError()
      }

      // Use full error page
      return this.renderFullError()
    }

    return this.props.children
  }
}

// Higher-order component for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook for imperative error handling
export function useErrorHandler() {
  return {
    throwError: (error: unknown) => {
      throw errorHandler.parseError(error)
    },
    handleError: (error: unknown) => {
      errorHandler.handleError(error)
    }
  }
} 