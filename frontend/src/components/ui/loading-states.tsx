/**
 * Professional Loading States & Skeleton Components
 * Provides consistent loading experiences throughout the application
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap, Activity, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spinnerVariants, pulseVariants, skeletonVariants } from '@/lib/animations';

// Base Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground'
  };

  return (
    <motion.div
      variants={spinnerVariants}
      animate="animate"
      className={cn(sizeClasses[size], colorClasses[color], className)}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
};

// Pulse Loader
export const PulseLoader: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    variants={pulseVariants}
    animate="animate"
    className={cn("w-3 h-3 bg-primary rounded-full", className)}
  />
);

// Skeleton Components
interface SkeletonProps {
  className?: string;
  animated?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  animated = true 
}) => {
  return (
    <motion.div
      variants={animated ? skeletonVariants : undefined}
      animate={animated ? "animate" : undefined}
      className={cn(
        "bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 rounded",
        animated && "bg-[length:400%_100%]",
        className
      )}
      style={animated ? {
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
      } : undefined}
    />
  );
};

// Specialized Skeleton Components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 border rounded-lg", className)}>
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  cols?: number; 
  className?: string 
}> = ({ rows = 5, cols = 4, className }) => (
  <div className={cn("space-y-4", className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="h-64 flex items-end justify-between gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="w-full rounded-t"
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  </div>
);

// Full Page Loading States
interface PageLoaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  title = "Loading SGPT",
  subtitle = "Please wait while we prepare your dashboard...",
  icon,
  className
}) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      rotateX: [0, 5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const scaleVariants = {
    initial: { opacity: 0, scale: 0.8, rotateY: -15 },
    animate: { 
      opacity: 1, 
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const slideUpVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const textGlowVariants = {
    animate: {
      textShadow: [
        "0 0 20px rgba(220, 38, 38, 0.3)",
        "0 0 30px rgba(239, 68, 68, 0.4)", 
        "0 0 20px rgba(220, 38, 38, 0.3)"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const cardGlowVariants = {
    animate: {
      boxShadow: [
        "0 0 30px rgba(220, 38, 38, 0.1)",
        "0 0 50px rgba(239, 68, 68, 0.15)",
        "0 0 30px rgba(220, 38, 38, 0.1)"
      ],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const orbitalVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden",
      className
    )}>
      {/* Enhanced Background Elements with 4D effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/10 via-gray-500/15 to-red-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 0.9, 1.2, 1],
            opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
            x: [0, 50, -30, 20, 0],
            y: [0, -30, 40, -20, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Secondary gradient orb */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-l from-gray-500/8 via-gray-600/12 to-red-500/8 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 0.8, 1.4, 1, 1.2],
            opacity: [0.2, 0.5, 0.1, 0.4, 0.2],
            x: [0, -40, 30, -15, 0],
            y: [0, 25, -35, 15, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Orbital rings */}
        <motion.div
          variants={orbitalVariants}
          animate="animate"
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="absolute inset-0 border border-primary/5 rounded-full" />
          <div className="absolute inset-8 border border-primary/3 rounded-full" />
          <motion.div 
            className="absolute top-4 left-1/2 w-2 h-2 bg-red-500/40 rounded-full -translate-x-1/2"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-2xl mx-auto text-center perspective-1000"
      >
        {/* Main Loading Display with 3D effect */}
        <motion.div
          variants={slideUpVariants}
          className="mb-8"
        >
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="relative inline-block preserve-3d"
          >
            <motion.div 
              className="text-7xl md:text-8xl font-bold text-primary/15 select-none"
              style={{ transform: 'translateZ(-20px)' }}
            >
              SGPT
            </motion.div>
            <motion.div
              variants={textGlowVariants}
              animate="animate"
              className="absolute inset-0 text-7xl md:text-8xl font-bold bg-gradient-to-r from-red-600 via-gray-400 to-red-700 bg-clip-text text-transparent"
              style={{ 
                transform: 'translateZ(0px)',
                filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.3))'
              }}
            >
              SGPT
            </motion.div>
            
            {/* Loading indicator overlay */}
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium text-primary/80"
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Loading...
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Enhanced Main Content Card with 3D effect */}
        <motion.div 
          variants={scaleVariants}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div 
            variants={cardGlowVariants}
            animate="animate"
            className="border border-primary/20 bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl rounded-2xl p-8 space-y-6 shadow-2xl"
            style={{ 
              transform: 'translateZ(20px)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
            }}
          >
            {/* Enhanced Icon with 3D rotation */}
            <motion.div
              variants={slideUpVariants}
              className="space-y-6"
            >
              <motion.div
                className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 text-primary shadow-xl"
                animate={{
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Icon glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-gray-500/20 rounded-2xl blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <div className="relative z-10">
                  {icon || <Mail className="w-10 h-10" />}
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-red-500 to-foreground bg-clip-text text-transparent"
                variants={textGlowVariants}
                animate="animate"
              >
                {title}
              </motion.h1>
              
              <motion.p 
                className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {subtitle}
              </motion.p>
            </motion.div>

            {/* Enhanced Loading Indicator with 4D animation */}
            <motion.div
              variants={slideUpVariants}
              className="flex justify-center items-center space-x-3 pt-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="relative"
                  animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.3, 1],
                    rotateX: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-gray-600 rounded-full shadow-lg" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-400/50 to-gray-500/50 rounded-full blur-sm"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Progress indicator */}
            <motion.div
              variants={slideUpVariants}
              className="pt-4"
            >
              <div className="w-full bg-muted/20 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-gray-500 to-red-600 rounded-full"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Enhanced Decorative Elements */}
        <motion.div
          variants={slideUpVariants}
          className="mt-8 flex justify-center space-x-3"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-red-500/60 to-gray-500/30 rounded-full"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.3, 1, 0.3],
                rotateZ: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Component Loading States
export const ComponentLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}> = ({ size = 'md', text, className }) => {
  const sizeClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8",
      sizeClasses[size],
      className
    )}>
      <Spinner size={size} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

// Data Loading States
export const DataLoader: React.FC<{
  type: 'table' | 'chart' | 'card' | 'list';
  count?: number;
  className?: string;
}> = ({ type, count = 3, className }) => {
  switch (type) {
    case 'table':
      return <SkeletonTable className={className} />;
    
    case 'chart':
      return <SkeletonChart className={className} />;
    
    case 'card':
      return (
        <div className={cn("grid gap-6", className)}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    
    case 'list':
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    
    default:
      return <ComponentLoader />;
  }
};

// Error States
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Something went wrong",
  message = "We encountered an error while loading this content.",
  onRetry,
  className
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center py-12 text-center space-y-4",
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
      <Activity className="w-8 h-8 text-destructive" />
    </div>
    
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
    
    {onRetry && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try Again
      </motion.button>
    )}
  </div>
);

// Empty States
export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({
  title = "No data available",
  message = "There's nothing to display here yet.",
  action,
  icon,
  className
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center py-12 text-center space-y-4",
    className
  )}>
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
      {icon || <Zap className="w-8 h-8 text-muted-foreground" />}
    </div>
    
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
    
    {action && <div>{action}</div>}
  </div>
);

export default {
  Spinner,
  PulseLoader,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  PageLoader,
  ComponentLoader,
  DataLoader,
  ErrorState,
  EmptyState
}; 