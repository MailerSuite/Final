/**
 * Standard UI Frame Component - SGPT Platform
 * Standardized design frame following 404 page design principles
 * Used for consistent UI patterns across modals, overlays, and content frames
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fadeInVariants, slideUpVariants, scaleVariants } from '@/lib/animations';

interface StandardFrameProps {
  /** Main content to display */
  children: ReactNode;
  /** Optional title for the frame header */
  title?: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional icon to display with title */
  icon?: ReactNode;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Close button handler */
  onClose?: () => void;
  /** Size variant of the frame */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show as overlay (fixed positioning) */
  overlay?: boolean;
  /** Additional footer actions */
  footerActions?: ReactNode;
  /** Custom className for the main container */
  className?: string;
  /** Whether to show animated background elements */
  showBackground?: boolean;
}

export const StandardFrame: React.FC<StandardFrameProps> = ({
  children,
  title,
  description,
  icon,
  showCloseButton = false,
  onClose,
  size = 'lg',
  overlay = false,
  footerActions,
  className = '',
  showBackground = true,
}) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const baseClasses = overlay 
    ? "fixed inset-0 z-50 flex items-center justify-center p-4 relative overflow-hidden"
    : `relative w-full ${sizeClasses[size]} mx-auto`;

  return (
    <div className={`${baseClasses} ${className}`}>
      {/* Background Elements */}
      {showBackground && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/3 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      )}

      {/* Overlay backdrop */}
      {overlay && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      )}

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full"
      >
        <motion.div variants={scaleVariants}>
          <Card className="border-muted/20 bg-card/50 backdrop-blur-sm shadow-2xl">
            {/* Header */}
            {(title || showCloseButton) && (
              <CardHeader className="bg-muted/30 backdrop-blur-sm border-b border-muted/20">
                <motion.div
                  variants={slideUpVariants}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {icon && (
                      <motion.div
                        variants={pulseVariants}
                        animate="animate"
                        className="text-primary"
                      >
                        {icon}
                      </motion.div>
                    )}
                    <div>
                      {title && (
                        <h2 className="text-lg font-semibold text-foreground">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {showCloseButton && onClose && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="opacity-70 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary rounded-sm p-2"
                    >
                      <X className="w-5 h-5" />
                      <span className="sr-only">Close</span>
                    </motion.button>
                  )}
                </motion.div>
              </CardHeader>
            )}

            {/* Content */}
            <CardContent className="p-6">
              <motion.div variants={slideUpVariants}>
                {children}
              </motion.div>
            </CardContent>

            {/* Footer */}
            {footerActions && (
              <motion.div 
                variants={slideUpVariants}
                className="px-6 py-4 bg-muted/20 backdrop-blur-sm border-t border-muted/20 flex justify-end gap-3"
              >
                {footerActions}
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Decorative Elements */}
        {showBackground && (
          <motion.div
            variants={fadeInVariants}
            className="mt-6 flex justify-center space-x-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary/40 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StandardFrame;