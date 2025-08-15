/**
 * Error Context Provider
 * Provides global error state management for React components
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { 
  errorHandler, 
  ApplicationError, 
  ErrorCategory, 
  ErrorContextData 
} from '../core/error-system'

const ErrorContext = createContext<ErrorContextData | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
  maxErrors?: number
  autoCleanupAfter?: number // milliseconds
}

export function ErrorProvider({ 
  children, 
  maxErrors = 10,
  autoCleanupAfter = 300000 // 5 minutes
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<ApplicationError[]>([])

  // Add error to state
  const addError = useCallback((error: ApplicationError) => {
    setErrors(prev => {
      const newErrors = [error, ...prev]
      // Keep only the most recent errors
      return newErrors.slice(0, maxErrors)
    })
  }, [maxErrors])

  // Remove error by ID
  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.errorId !== errorId))
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Get errors by category
  const getErrorsByCategory = useCallback((category: ErrorCategory) => {
    return errors.filter(e => e.category === category)
  }, [errors])

  // Get latest error
  const getLatestError = useCallback(() => {
    return errors[0] || null
  }, [errors])

  // Set up error listener
  useEffect(() => {
    const unsubscribe = errorHandler.addErrorListener((error) => {
      addError(error)
    })

    return unsubscribe
  }, [addError])

  // Auto cleanup old errors
  useEffect(() => {
    if (autoCleanupAfter <= 0 || errors.length === 0) return

    const timer = setInterval(() => {
      const cutoffTime = Date.now() - autoCleanupAfter
      setErrors(prev => prev.filter(error => {
        const errorTime = new Date(error.timestamp || 0).getTime()
        return errorTime > cutoffTime
      }))
    }, 60000) // Check every minute

    return () => clearInterval(timer)
  }, [autoCleanupAfter, errors.length])

  const contextValue: ErrorContextData = {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors: errors.length > 0,
    getErrorsByCategory,
    getLatestError
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  )
}

// Hook to use error context
export function useErrorContext() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider')
  }
  return context
}

// Hook for error notifications
export function useErrorNotifications() {
  const { errors, removeError } = useErrorContext()
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set())

  const dismissError = useCallback((errorId: string) => {
    setDismissedErrors(prev => new Set(prev).add(errorId))
    removeError(errorId)
  }, [removeError])

  const activeErrors = errors.filter(error => !dismissedErrors.has(error.errorId))

  return {
    activeErrors,
    dismissError,
    dismissAll: () => {
      errors.forEach(error => dismissError(error.errorId))
    }
  }
}

// Error display component
export function ErrorDisplay({ 
  category, 
  className,
  showDismiss = true 
}: { 
  category?: ErrorCategory
  className?: string
  showDismiss?: boolean 
}) {
  const { errors, removeError } = useErrorContext()
  const displayErrors = category 
    ? errors.filter(e => e.category === category)
    : errors

  if (displayErrors.length === 0) return null

  return (
    <div className={className}>
      {displayErrors.map((error) => (
        <div 
          key={error.errorId} 
          className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {error.getUserFriendlyMessage()}
              </p>
              {error.code && (
                <p className="text-xs text-red-600 mt-1">
                  Error Code: {error.code}
                </p>
              )}
            </div>
            {showDismiss && (
              <button
                onClick={() => removeError(error.errorId)}
                className="ml-3 text-red-400 hover:text-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 