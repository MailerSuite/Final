/**
 * ⚡ Glitch Text Effect Component
 * Animated glitch effect for text elements
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className }) => {
  return (
    <div className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-red-500 opacity-70 animate-pulse"
        style={{
          clipPath: 'polygon(0 20%, 100% 20%, 100% 21%, 0 21%)',
          transform: 'translateX(-2px)'
        }}
      >
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 w-full h-full text-cyan-500 opacity-70 animate-pulse"
        style={{
          clipPath: 'polygon(0 60%, 100% 60%, 100% 61%, 0 61%)',
          transform: 'translateX(2px)',
          animationDelay: '0.1s'
        }}
      >
        {text}
      </span>
    </div>
  );
}; 