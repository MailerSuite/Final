/**
 * 🌌 Gradient Orbs Animation Component
 * Floating animated gradient orbs for background
 */

import React from 'react';
import { motion } from 'framer-motion';

export const GradientOrbs: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <motion.div 
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px]"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
        animate={{
          x: [0, -150, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[120px]"
        animate={{
          x: [0, 100, 0],
          y: [0, -150, 0],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}; 