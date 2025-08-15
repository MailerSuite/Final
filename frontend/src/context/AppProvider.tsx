import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Application State Types
interface AppState {
  user: unknown;
  theme: string;
  loading: boolean;
  errors: string[];
  navigationHistory: string[];
  currentRoute: string;
}

type AppAction = 
  | { type: 'SET_USER'; payload: unknown }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'ADD_NAVIGATION'; payload: string }
  | { type: 'SET_CURRENT_ROUTE'; payload: string };

const initialState: AppState = {
  user: null,
  theme: 'dark',
  loading: false,
  errors: [],
  navigationHistory: [],
  currentRoute: '/',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_ERROR':
      return { ...state, errors: [...state.errors, action.payload] };
    case 'CLEAR_ERRORS':
      return { ...state, errors: [] };
    case 'ADD_NAVIGATION':
      return { 
        ...state, 
        navigationHistory: [...state.navigationHistory, action.payload].slice(-10) // Keep last 10
      };
    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: action.payload };
    default:
      return state;
  }
}

// Context Creation
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Hook for using app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Error Reporting Service
class ErrorReporter {
  static report(error: Error, context?: string) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: context || 'Unknown',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorReporter:', errorData);
    }

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('opus-errors') || '[]');
      existingErrors.push(errorData);
      // Keep only last 50 errors
      const recentErrors = existingErrors.slice(-50);
      localStorage.setItem('opus-errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Could not save error to localStorage:', e);
    }

    // In production, you would send to an error reporting service
    // Example: Sentry, LogRocket, or custom endpoint
    if (import.meta.env.PROD) {
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(() => {}); // Ignore if error reporting fails
    }
  }
}

// Main App Provider - Simplified without Framework7 for now
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      ErrorReporter.report(new Error(event.message), 'Global Error Handler');
      dispatch({ type: 'ADD_ERROR', payload: event.message });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      ErrorReporter.report(error, 'Unhandled Promise Rejection');
      dispatch({ type: 'ADD_ERROR', payload: error.message });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Track route changes via URL
  useEffect(() => {
    const currentPath = window.location.pathname;
    dispatch({ type: 'SET_CURRENT_ROUTE', payload: currentPath });
    dispatch({ type: 'ADD_NAVIGATION', payload: currentPath });
  }, []);

  const contextValue = {
    state,
    dispatch
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Export ErrorReporter for use in other components
export { ErrorReporter };