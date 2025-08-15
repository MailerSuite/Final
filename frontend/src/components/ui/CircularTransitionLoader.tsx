/**
 * Circular Transition Loader - Dark/Blue/Magical AI Style
 * Beautiful circular background animation for page transitions with deep blues and dark purples
 */

import React from 'react';
import { motion } from 'framer-motion';

interface CircularTransitionLoaderProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  variant?: 'minimal' | 'standard' | 'magical';
  className?: string;
}

const CircularTransitionLoader: React.FC<CircularTransitionLoaderProps> = ({
  isActive = true,
  size = 'fullscreen',
  variant = 'magical',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    fullscreen: 'w-screen h-screen'
  };

  // Optimized magical circle animations - simplified for better performance
  const outerCircleVariants = {
    animate: {
      rotate: 360,
      scale: [1, 1.05, 1],
      transition: {
        rotate: {
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        },
        scale: {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  };

  const middleCircleVariants = {
    animate: {
      rotate: -360,
      transition: {
        duration: 18,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const innerCircleVariants = {
    animate: {
      rotate: 360,
      scale: [1, 1.1, 1],
      transition: {
        rotate: {
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        },
        scale: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  };

  const particleVariants = {
    animate: (i: number) => ({
      rotate: 360,
      opacity: [0, 0.6, 0],
      transition: {
        rotate: {
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          delay: i * 0.8
        },
        opacity: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.4
        }
      }
    })
  };

  if (!isActive) return null;

  return (
    <div 
      className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}
      style={{ 
        background: size === 'fullscreen' 
          ? 'radial-gradient(circle, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 50%, rgba(2, 6, 23, 1) 100%)'
          : 'transparent',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Optimized background mystical glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%)',
          filter: 'blur(30px)',
          willChange: 'transform, opacity'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Optimized outer rotating circle */}
      <motion.div
        className="absolute w-full h-full rounded-full border-2"
        style={{
          borderColor: 'rgba(59, 130, 246, 0.5)',
          background: 'conic-gradient(from 0deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1))',
          willChange: 'transform'
        }}
        variants={outerCircleVariants}
        animate="animate"
      />

      {/* Optimized middle rotating circle */}
      <motion.div
        className="absolute w-3/4 h-3/4 rounded-full border"
        style={{
          borderColor: 'rgba(147, 197, 253, 0.4)',
          background: 'conic-gradient(from 180deg, rgba(147, 197, 253, 0.05), rgba(168, 85, 247, 0.1), rgba(147, 197, 253, 0.05))',
          willChange: 'transform'
        }}
        variants={middleCircleVariants}
        animate="animate"
      />

      {/* Optimized inner rotating circle */}
      <motion.div
        className="absolute w-1/2 h-1/2 rounded-full border"
        style={{
          borderColor: 'rgba(96, 165, 250, 0.6)',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)',
          willChange: 'transform'
        }}
        variants={innerCircleVariants}
        animate="animate"
      />

      {/* Optimized magical floating particles */}
      {variant === 'magical' && (
        <div className="absolute inset-0" style={{ willChange: 'transform' }}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: i % 2 === 0 ? '#60a5fa' : '#8b5cf6',
                left: '50%',
                top: '50%',
                transformOrigin: `${50 + i * 25}px 0px`,
                willChange: 'transform, opacity'
              }}
              variants={particleVariants}
              animate="animate"
              custom={i}
            />
          ))}
        </div>
      )}

      {/* Optimized center mystical core */}
      <motion.div
        className="absolute w-4 h-4 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.7) 0%, rgba(139, 92, 246, 0.5) 50%, rgba(30, 41, 59, 0.8) 100%)',
          willChange: 'transform, opacity'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Optimized scanning lines */}
      {variant !== 'minimal' && (
        <>
          <motion.div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
            style={{ 
              top: '50%', 
              transformOrigin: 'center',
              willChange: 'transform'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400/60 to-transparent"
            style={{ 
              left: '50%', 
              transformOrigin: 'center',
              willChange: 'transform'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </>
      )}
    </div>
  );
};

export default CircularTransitionLoader;