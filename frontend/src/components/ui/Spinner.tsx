import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'blue' | 'white' | 'slate';
  className?: string;
  children?: React.ReactNode;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'blue',
  className,
  children
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-blue-500',
    blue: 'border-blue-400',
    white: 'border-white',
    slate: 'border-slate-400'
  };

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <motion.div
        className={cn(
          'rounded-full border-2 border-transparent',
          sizeClasses[size],
          `border-t-${variant === 'blue' ? 'blue-400' : variant === 'primary' ? 'blue-500' : variant === 'white' ? 'white' : 'slate-400'}`,
          `border-r-${variant === 'blue' ? 'blue-400' : variant === 'primary' ? 'blue-500' : variant === 'white' ? 'white' : 'slate-400'}/30`,
          `border-b-${variant === 'blue' ? 'blue-400' : variant === 'primary' ? 'blue-500' : variant === 'white' ? 'white' : 'slate-400'}/10`,
          `border-l-${variant === 'blue' ? 'blue-400' : variant === 'primary' ? 'blue-500' : variant === 'white' ? 'white' : 'slate-400'}/5`
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {children && (
        <motion.span 
          className={cn(
            'text-sm font-medium',
            variant === 'white' ? 'text-white' : 'text-muted-foreground'
          )}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {children}
        </motion.span>
      )}
    </div>
  );
};

// Professional Neural-Style Spinner (matching our neural background theme)
export const NeuralSpinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  children
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16', 
    xl: 'w-24 h-24'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-blue-400/50"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Inner counter-rotating ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-transparent border-t-blue-300/70 border-l-blue-300/30"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Center pulsing dot */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 bg-blue-400 rounded-full"
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Neural connection lines */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <div className="absolute top-0 left-1/2 w-px h-2 bg-blue-400 -ml-px" />
          <div className="absolute bottom-0 left-1/2 w-px h-2 bg-blue-400 -ml-px" />
          <div className="absolute left-0 top-1/2 w-2 h-px bg-blue-400 -mt-px" />
          <div className="absolute right-0 top-1/2 w-2 h-px bg-blue-400 -mt-px" />
        </motion.div>
      </div>
      
      {children && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="text-sm font-medium text-blue-400 mb-1">
            {children}
          </div>
          <motion.div 
            className="flex items-center justify-center gap-1"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-blue-400/50 rounded-full"
                animate={{ scale: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  variant?: 'neural' | 'simple';
  backdrop?: boolean;
}> = ({ isLoading, message = 'Loading...', variant = 'neural', backdrop = true }) => {
  if (!isLoading) return null;

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        backdrop && 'bg-black/60 backdrop-blur-sm'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {variant === 'neural' ? (
        <NeuralSpinner size="lg">{message}</NeuralSpinner>
      ) : (
        <Spinner size="lg" variant="blue">{message}</Spinner>
      )}
    </motion.div>
  );
};

export default Spinner;