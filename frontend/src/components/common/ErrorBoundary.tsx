import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enhanced error logging for better debugging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log to console for development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      // Example: Sentry, LogRocket, etc.
      if ((window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
        });
      }
    }
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });
    
    // Small delay to prevent immediate re-triggering
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      isRetrying: false,
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount, isRetrying } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
      const isAuthError = error?.message?.includes('401') || error?.message?.includes('unauthorized');

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error type specific messages */}
              {isAuthError && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your session has expired. Please refresh the page to log in again.
                  </AlertDescription>
                </Alert>
              )}
              
              {isNetworkError && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Network connection issue detected. Please check your internet connection.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error details for development */}
              {import.meta.env.DEV && error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="font-mono text-xs">
                    {error.message}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground text-center">
                {isAuthError 
                  ? "Please refresh the page to continue."
                  : "We're sorry for the inconvenience. Try refreshing the page or contact support if the problem persists."
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && !isAuthError && (
                  <Button 
                    onClick={this.handleRetry} 
                    disabled={isRetrying}
                    className="flex-1"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again ({this.maxRetries - retryCount} left)
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleRefreshPage}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Error ID: {Date.now().toString(36)} | Time: {new Date().toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

