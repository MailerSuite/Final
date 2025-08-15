/**
 * 🚀 Hero Section Component
 * Main hero section for landing pages with background and layout
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'video';
  backgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  children,
  className,
  variant = 'default',
  backgroundImage
}) => {
  const baseClasses = "relative min-h-screen flex items-center justify-center overflow-hidden";
  
  const variantClasses = {
    default: "bg-background",
    gradient: "bg-gradient-to-br from-background via-background to-primary/5",
    video: "bg-black"
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(baseClasses, variantClasses[variant], className)}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {/* Background overlay for readability */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/60 z-0" />
      )}
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {children}
      </div>
    </motion.section>
  );
};