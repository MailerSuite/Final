/**
 * Professional 3D Loader Components
 * 
 * Created by Senior Frontend Developer
 * 
 * Features:
 * - 5 different 3D animation variants (spinner, pulse, orbit, wave, cube)
 * - Multiple size options (sm, md, lg, xl)
 * - Color themes (primary, secondary, accent, white)
 * - Full-screen overlay support with ambient background effects
 * - Page loading wrapper component
 * - Card loading skeleton with staggered animations
 * - Framer Motion powered smooth animations
 * - TypeScript support with proper interfaces
 * 
 * Usage:
 * - <ProfessionalLoader variant="orbit" size="lg" text="Loading..." />
 * - <PageLoader isLoading={true} text="Please wait..." />
 * - <CardLoader cards={4} className="grid-cols-4" />
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProfessionalLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'orbit' | 'wave' | 'cube';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const ProfessionalLoader: React.FC<ProfessionalLoaderProps> = ({
  size = 'md',
  variant = 'orbit',
  color = 'primary',
  text,
  fullScreen = false,
  className
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colorClasses = {
    primary: 'border-red-500',
    secondary: 'border-blue-500',
    accent: 'border-purple-500',
    white: 'border-white'
  };

  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2
      }
    },
    end: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const spinnerVariants = {
    start: {
      rotate: 0,
      scale: 1
    },
    end: {
      rotate: 360,
      scale: 1.1,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const pulseVariants = {
    start: {
      scale: 0.8,
      opacity: 0.5
    },
    end: {
      scale: 1.2,
      opacity: 1,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  const orbitVariants = {
    start: {
      rotate: 0
    },
    end: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const waveVariants = {
    start: {
      y: 0
    },
    end: {
      y: -10,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  const cubeVariants = {
    start: {
      rotateX: 0,
      rotateY: 0
    },
    end: {
      rotateX: 360,
      rotateY: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const textVariants = {
    start: {
      opacity: 0.7
    },
    end: {
      opacity: 1,
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            className={cn(
              'border-4 border-transparent rounded-full',
              sizeClasses[size],
              colorClasses[color]
            )}
            style={{
              borderTopColor: 'currentColor',
              borderRightColor: 'currentColor'
            }}
            variants={spinnerVariants}
            initial="start"
            animate="end"
          />
        );

      case 'pulse':
        return (
          <motion.div
            className={cn(
              'rounded-full bg-current',
              sizeClasses[size]
            )}
            variants={pulseVariants}
            initial="start"
            animate="end"
          />
        );

      case 'orbit':
        return (
          <motion.div
            className={cn('relative', sizeClasses[size])}
            variants={orbitVariants}
            initial="start"
            animate="end"
          >
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current opacity-75" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-r-current opacity-50" />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-current opacity-25" />
          </motion.div>
        );

      case 'wave':
        return (
          <div className={cn('flex items-end space-x-1', sizeClasses[size])}>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 bg-current rounded-full"
                style={{ height: '60%' }}
                variants={waveVariants}
                initial="start"
                animate="end"
                transition={{
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );

      case 'cube':
        return (
          <motion.div
            className={cn('preserve-3d', sizeClasses[size])}
            variants={cubeVariants}
            initial="start"
            animate="end"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            <div 
              className="absolute inset-0 bg-current opacity-20 rounded"
              style={{
                transform: 'rotateY(0deg) translateZ(12px)'
              }}
            />
            <div 
              className="absolute inset-0 bg-current opacity-30 rounded"
              style={{
                transform: 'rotateY(90deg) translateZ(12px)'
              }}
            />
            <div 
              className="absolute inset-0 bg-current opacity-40 rounded"
              style={{
                transform: 'rotateY(180deg) translateZ(12px)'
              }}
            />
            <div 
              className="absolute inset-0 bg-current opacity-50 rounded"
              style={{
                transform: 'rotateY(-90deg) translateZ(12px)'
              }}
            />
            <div 
              className="absolute inset-0 bg-current opacity-60 rounded"
              style={{
                transform: 'rotateX(90deg) translateZ(12px)'
              }}
            />
            <div 
              className="absolute inset-0 bg-current opacity-70 rounded"
              style={{
                transform: 'rotateX(-90deg) translateZ(12px)'
              }}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  const content = (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center space-y-4',
        {
          'text-red-500': color === 'primary',
          'text-blue-500': color === 'secondary',
          'text-purple-500': color === 'accent',
          'text-white': color === 'white'
        },
        className
      )}
      variants={containerVariants}
      initial="start"
      animate="end"
    >
      {renderLoader()}
      
      {text && (
        <motion.p
          className={cn(
            'text-sm font-medium',
            {
              'text-zinc-400': color !== 'white',
              'text-white/80': color === 'white'
            }
          )}
          variants={textVariants}
          initial="start"
          animate="end"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 backdrop-blur-sm">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          {content}
        </div>
        
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full">
            <motion.div
              className="w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full">
            <motion.div
              className="w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
              animate={{
                x: [0, -100, 0],
                y: [0, 50, 0],
                scale: [1.2, 1, 1.2]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return content;
};

// Page loading wrapper component
interface PageLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  variant?: ProfessionalLoaderProps['variant'];
  minHeight?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading,
  children,
  text = "Loading...",
  variant = "orbit",
  minHeight = "400px"
}) => {
  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center w-full"
        style={{ minHeight }}
      >
        <ProfessionalLoader
          variant={variant}
          text={text}
          size="lg"
          color="primary"
        />
      </div>
    );
  }

  return <>{children}</>;
};

// Card loading skeleton component
export const CardLoader: React.FC<{
  cards?: number;
  className?: string;
}> = ({ cards = 3, className }) => {
  return (
    <div className={cn('grid gap-4', className)}>
      {Array.from({ length: cards }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 bg-zinc-800 rounded-lg"
                animate={{
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="space-y-2 flex-1">
                <motion.div
                  className="h-4 bg-zinc-800 rounded w-3/4"
                  animate={{
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                />
                <motion.div
                  className="h-3 bg-zinc-800 rounded w-1/2"
                  animate={{
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4
                  }}
                />
              </div>
            </div>
            <motion.div
              className="h-24 bg-zinc-800 rounded"
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfessionalLoader; 