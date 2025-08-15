/**
 * Premium Mail-Themed Loading Animation - MailerSuite Platform
 * Beautiful animated loader with email/mail system theme, blue glow effects, and premium aesthetics
 */

import React from 'react';
import { motion } from 'framer-motion';

interface PremiumMailLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'full';
  showText?: boolean;
  text?: string;
  className?: string;
}

const PremiumMailLoader: React.FC<PremiumMailLoaderProps> = ({
  size = 'md',
  variant = 'default',
  showText = true,
  text = 'Loading MailerSuite...',
  className = ''
}) => {
  const sizeClasses = {
    sm: { 
      container: 'w-12 h-12', 
      envelope: 'w-8 h-6', 
      text: 'text-xs mt-2',
      particles: 'w-0.5 h-0.5'
    },
    md: { 
      container: 'w-16 h-16', 
      envelope: 'w-12 h-9', 
      text: 'text-sm mt-3',
      particles: 'w-1 h-1'
    },
    lg: { 
      container: 'w-20 h-20', 
      envelope: 'w-16 h-12', 
      text: 'text-base mt-3',
      particles: 'w-1.5 h-1.5'
    },
    xl: { 
      container: 'w-24 h-24', 
      envelope: 'w-20 h-15', 
      text: 'text-lg mt-4',
      particles: 'w-2 h-2'
    }
  };

  const s = sizeClasses[size];

  // Optimized envelope floating animation - using only GPU-accelerated properties
  const envelopeVariants = {
    animate: {
      y: [0, -12, 0],
      rotateX: [0, 8, 0],
      rotateY: [0, -5, 5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Optimized glow pulse animation
  const glowVariants = {
    animate: {
      scale: [1, 1.3, 1],
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Simplified orbital ring animations for better performance
  const outerRingVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const innerRingVariants = {
    animate: {
      rotate: -360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  // Optimized flying email particles
  const particleVariants = {
    animate: (i: number) => ({
      rotate: 360,
      opacity: [0, 0.8, 0],
      scale: [0.5, 1, 0.5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.5
      }
    })
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Optimized main loader container */}
      <div 
        className={`relative ${s.container} flex items-center justify-center`}
        style={{ 
          perspective: '200px',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Optimized background glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-blue-500/30 to-blue-600/20"
          style={{
            filter: 'blur(20px)',
            willChange: 'transform, opacity'
          }}
          variants={glowVariants}
          animate="animate"
        />

        {/* Optimized orbital rings */}
        <motion.div
          className="absolute inset-2 border-2 border-blue-400/40 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))',
            willChange: 'transform'
          }}
          variants={outerRingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute inset-4 border border-blue-300/30 rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, rgba(147, 197, 253, 0.05), rgba(147, 197, 253, 0.15), rgba(147, 197, 253, 0.05))',
            willChange: 'transform'
          }}
          variants={innerRingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute inset-6 border border-blue-200/20 rounded-full"
          style={{ willChange: 'transform' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* Optimized main envelope animation */}
        <motion.div
          className="relative z-10"
          variants={envelopeVariants}
          animate="animate"
          style={{ 
            transformStyle: 'preserve-3d',
            willChange: 'transform'
          }}
        >
          {/* Envelope SVG */}
          <div className={`${s.envelope} relative`}>
            <svg viewBox="0 0 80 60" className="w-full h-full drop-shadow-lg">
              {/* Definitions */}
              <defs>
                <linearGradient id="envelopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="30%" stopColor="#60a5fa" />
                  <stop offset="70%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
                
                <linearGradient id="flapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                
                <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                <filter id="deepShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#1e293b" flood-opacity="0.5"/>
                </filter>
              </defs>

              {/* Envelope shadow for depth */}
              <rect
                x="12" y="22" width="60" height="35"
                fill="url(#shadowGradient)"
                opacity="0.3"
                filter="url(#deepShadow)"
                rx="2"
              />

              {/* Envelope body with enhanced 3D effect */}
              <motion.rect
                x="10" y="20" width="60" height="35"
                fill="url(#envelopeGradient)"
                stroke="#1e40af"
                strokeWidth="1"
                filter="url(#glow)"
                rx="2"
                animate={{
                  strokeWidth: [1, 1.8, 1],
                  scale: [1, 1.02, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Envelope flap with enhanced animation */}
              <motion.path
                d="M10,20 L40,40 L70,20"
                fill="none"
                stroke="url(#flapGradient)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#glow)"
                animate={{
                  strokeWidth: [2.5, 4, 2.5],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Email content lines with slower typing effect */}
              <motion.g opacity="0.8">
                <motion.line
                  x1="15" y1="28" x2="55" y2="28"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    strokeWidth: [1.2, 2, 1.2]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0 }}
                />
                <motion.line
                  x1="15" y1="35" x2="45" y2="35"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    strokeWidth: [1.2, 2, 1.2]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                />
                <motion.line
                  x1="15" y1="42" x2="50" y2="42"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    strokeWidth: [1.2, 2, 1.2]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 3 }}
                />
              </motion.g>

              {/* Enhanced send arrow with 3D movement */}
              <motion.g
                animate={{
                  x: [0, 20, 40],
                  y: [0, -5, 0],
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              >
                <path
                  d="M55,15 L65,15 M60,10 L65,15 L60,20"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              </motion.g>
            </svg>
          </div>
        </motion.div>

        {/* Optimized flying particles around the envelope */}
        {variant !== 'minimal' && (
          <div className="absolute inset-0" style={{ willChange: 'transform' }}>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute ${s.particles} bg-blue-400 rounded-full`}
                style={{
                  left: '30%',
                  top: '50%',
                  transformOrigin: `${40 + i * 15}px 0px`,
                  willChange: 'transform, opacity'
                }}
                variants={particleVariants}
                animate="animate"
                custom={i}
              />
            ))}
          </div>
        )}

        {/* Optimized corner accent elements */}
        {variant === 'full' && (
          <>
            {[0, 0.8, 1.6, 2.4].map((delay, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 bg-blue-400 rounded-full ${
                  i === 0 ? 'top-0 left-0' :
                  i === 1 ? 'top-0 right-0' :
                  i === 2 ? 'bottom-0 left-0' : 'bottom-0 right-0'
                }`}
                style={{ willChange: 'transform, opacity' }}
                animate={{
                  scale: [0.5, 1, 0.5],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity, delay }}
              />
            ))}
          </>
        )}
      </div>

      {/* Enhanced loading text with better animation */}
      {showText && (
        <motion.div
          className={`text-center ${s.text}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.p
            className="font-medium text-blue-600 dark:text-blue-400 tracking-wide"
            animate={{
              opacity: [0.6, 1, 0.6],
              y: [0, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {text}
          </motion.p>
          
          {/* Enhanced animated loading dots with stagger */}
          <motion.div className="flex justify-center space-x-2 mt-3">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [0, 1.2, 0],
                  opacity: [0, 1, 0],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4
                }}
              />
            ))}
          </motion.div>
          
          {/* Progress indicator */}
          <motion.div 
            className="mt-4 w-32 h-0.5 bg-blue-200/30 rounded-full mx-auto overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PremiumMailLoader;