/**
 * Toast hook for showing notifications
 */

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export const toast = (options: ToastOptions | string) => {
  const message = typeof options === 'string' ? options : options.description || options.title || '';
  const variant = typeof options === 'object' ? options.variant : 'default';
  
  // Simple console logging for now - can be enhanced with a proper toast system later
  if (variant === 'destructive') {
    console.error('🚨 Error:', message);
  } else if (variant === 'success') {
    console.log('✅ Success:', message);
  } else {
    console.log('ℹ️ Info:', message);
  }
  
  // You can integrate with a proper toast library like react-hot-toast here
  // For now, just using browser alerts as fallback
  if (typeof window !== 'undefined') {
    // Only show alerts for errors to avoid spam
    if (variant === 'destructive') {
      alert(message);
    }
  }
};

export const useToast = () => {
  return { toast };
}; 