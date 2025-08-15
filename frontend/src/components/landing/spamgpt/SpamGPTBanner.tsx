/**
 * 🎯 SpamGPT ASCII Banner Component
 * Animated ASCII art banner for SpamGPT branding
 */

import React from 'react';
import { motion } from 'framer-motion';

export const SpamGPTBanner: React.FC = () => {
  const asciiArt = [
    "   ____                       ____ ____ _____ ",
    "  / ___| _ __   __ _ _ __ ___/ ___|  _ \\_   _|",
    "  \\___ \\| '_ \\ / _` | '_ ` _ \\___ \\| |_) || |  ",
    "   ___) | |_) | (_| | | | | | |__) |  __/ | |  ",
    "  |____/| .__/ \\__,_|_| |_| |_|____/|_|   |_|  ",
    "        |_|                                     "
  ];

  return (
    <motion.div
      className="hidden lg:block absolute top-20 right-10 font-mono text-xs text-red-500/20"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 2 }}
    >
      {asciiArt.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 + index * 0.1 }}
        >
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}; 