"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  severity?: 'info' | 'success' | 'warning' | 'critical';
  duration?: number;
}

interface Toast {
  (...args: unknown[]): void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  loading: (message: string, options?: ToastOptions) => void;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => Promise<T>;
  dismiss: (toastId?: string | number) => void;
}

// Global toast state
const toastState = {
  toasts: [] as ToastItem[],
  listeners: new Set<() => void>(),
};

// Add toast to state
const addToast = (toast: ToastItem) => {
  toastState.toasts.push(toast);
  toastState.listeners.forEach(listener => listener());
  
  // Auto remove after duration
  setTimeout(() => {
    removeToast(toast.id);
  }, toast.duration || 5000);
};

// Remove toast from state
const removeToast = (id: string) => {
  toastState.toasts = toastState.toasts.filter(t => t.id !== id);
  toastState.listeners.forEach(listener => listener());
};

// useToast hook
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>(toastState.toasts);

  React.useEffect(() => {
    const listener = () => setToasts([...toastState.toasts]);
    toastState.listeners.add(listener);
    return () => {
      toastState.listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    toast: (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36);
      addToast({ ...toast, id });
    },
    dismiss: (toastId: string) => removeToast(toastId),
  };
};

// Filter out certain errors that shouldn't be shown to users
const shouldShowError = (message: string): boolean => {
  const suppressedErrors = [
    'not found',
    '404',
    'failed to fetch',
    'network error',
    'failed to load'
  ];
  
  const lowerMessage = message.toLowerCase();
  return !suppressedErrors.some(error => lowerMessage.includes(error));
};

export const toast: Toast = Object.assign(
  (...args: unknown[]) => {
    // Handle object-based toast calls like toast({ description: '...', severity: '...' })
    if (args.length === 1 && typeof args[0] === 'object' && args[0].description && args[0].severity) {
      const { description, severity, ...rest } = args[0];
      switch (severity) {
        case 'success':
          return toast.success(description, rest);
        case 'critical':
          return toast.error(description, rest);
        case 'warning':
          return toast.warning(description, rest);
        case 'info':
          return toast.info(description, rest);
        default:
          return toast.info(description, rest);
      }
    }
    // Fallback to original sonner behavior for other cases
    return sonnerToast(...args);
  },
  {
    success: (message: string, options?: ToastOptions) => {
      const id = Math.random().toString(36);
      addToast({
        id,
        title: message,
        description: options?.description,
        severity: 'success',
        duration: options?.duration,
      });
      
      return sonnerToast.success(message, {
        ...options,
        className: 'bg-zinc-900 border-zinc-800 text-white',
        descriptionClassName: 'text-gray-400',
      });
    },
    error: (message: string, options?: ToastOptions) => {
      // Only show errors that are user-actionable
      if (!shouldShowError(message)) {
        console.error('Suppressed error toast:', message);
        return;
      }
      
      const id = Math.random().toString(36);
      addToast({
        id,
        title: message,
        description: options?.description,
        severity: 'critical',
        duration: options?.duration,
      });
      
      return sonnerToast.error(message, {
        ...options,
        className: 'bg-red-950/50 border-red-900 text-red-400',
        descriptionClassName: 'text-red-300',
      });
    },
    info: (message: string, options?: ToastOptions) => {
      const id = Math.random().toString(36);
      addToast({
        id,
        title: message,
        description: options?.description,
        severity: 'info',
        duration: options?.duration,
      });
      
      return sonnerToast.info(message, {
        ...options,
        className: 'bg-zinc-900 border-zinc-800 text-white',
        descriptionClassName: 'text-gray-400',
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      const id = Math.random().toString(36);
      addToast({
        id,
        title: message,
        description: options?.description,
        severity: 'warning',
        duration: options?.duration,
      });
      
      return sonnerToast.warning(message, {
        ...options,
        className: 'bg-yellow-950/50 border-yellow-900 text-yellow-400',
        descriptionClassName: 'text-yellow-300',
      });
    },
    loading: (message: string, options?: ToastOptions) => {
      const id = Math.random().toString(36);
      addToast({
        id,
        title: message,
        description: options?.description,
        severity: 'info',
        duration: options?.duration,
      });
      
      return sonnerToast.loading(message, {
        ...options,
        className: 'bg-zinc-900 border-zinc-800 text-white',
        descriptionClassName: 'text-gray-400',
      });
    },
    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ): Promise<T> => {
      return sonnerToast.promise(promise, {
        loading: options.loading,
        success: options.success,
        error: (error) => {
          const errorMessage = typeof options.error === 'function'
            ? options.error(error)
            : options.error;
          
          // Check if we should show this error
          if (!shouldShowError(errorMessage)) {
            console.error('Suppressed promise error toast:', errorMessage);
            return 'Operation failed';
          }
          
          return errorMessage;
        }
      });
    },
    dismiss: (toastId?: string | number) => {
      if (toastId) {
        removeToast(String(toastId));
      }
      sonnerToast.dismiss(toastId);
    },
  }
);

export { toast as default };
