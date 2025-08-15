// Deprecated in favor of components/ui/GlobalErrorBoundary. Keeping a lightweight wrapper
// to avoid breaking imports during migration.
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';

interface ErrorFallbackProps extends FallbackProps {
  title?: string;
  description?: string;
}

function ErrorFallback({ error, resetErrorBoundary, title, description }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4" />
          <CardTitle className="text-xl font-semibold text-foreground dark:text-gray-100">
            {title || 'Something went wrong'}
          </CardTitle>
          <CardDescription className="text-muted-foreground dark:text-muted-foreground">
            {description || 'An unexpected error occurred while loading this page.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && (
            <details className="bg-muted dark:bg-card rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-all">
                {error.message}
                {error.stack && (
                  <div className="mt-2 text-muted-foreground dark:text-muted-foreground">
                    {error.stack}
                  </div>
                )}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <button onClick={resetErrorBoundary} className="flex-1 px-3 py-2 rounded bg-primary text-primary-foreground">Try Again</button>
            <a href="/" className="flex-1 px-3 py-2 rounded border">Go Home</a>
          </div>
          
          <div className="text-center text-sm text-muted-foreground dark:text-muted-foreground">
            If this problem persists, please refresh the page or contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function AppErrorBoundary({ 
  children, 
  title, 
  description, 
  onError 
}: AppErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    // Log to external service in production
    if (import.meta.env.PROD && onError) {
      onError(error, errorInfo);
    }
    
    // Store error in sessionStorage for debugging
    try {
      sessionStorage.setItem('lastError', JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack
      }));
    } catch (e) {
      // Ignore if sessionStorage is unavailable
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => (
        <ErrorFallback {...props} title={title} description={description} />
      )}
      onError={handleError}
      onReset={() => {
        // Clear error from sessionStorage on reset
        try {
          sessionStorage.removeItem('lastError');
        } catch (e) {
          // Ignore if sessionStorage is unavailable
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Page-level error boundary for route errors
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary
      title="Page Load Error"
      description="There was an error loading this page. This might be due to a missing component or network issue."
    >
      {children}
    </AppErrorBoundary>
  );
}

// Component-level error boundary for smaller errors
export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode;
  componentName?: string;
}) {
  return (
    <AppErrorBoundary
      title={`${componentName || 'Component'} Error`}
      description="A component failed to render properly. The rest of the page should work normally."
    >
      {children}
    </AppErrorBoundary>
  );
}