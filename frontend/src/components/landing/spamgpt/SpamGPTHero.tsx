/**
 * 🚀 SpamGPT Hero Section
 * Main hero section with SpamGPT branding and animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpamGPTBanner } from './SpamGPTBanner';
import { GlitchText } from './GlitchText';

export const SpamGPTHero: React.FC = () => {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* SpamGPT ASCII Banner */}
      <SpamGPTBanner />
      
      <div className="max-w-7xl mx-auto text-center relative">
        <motion.div 
          className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated SpamGPT Logo */}
          <motion.div 
            className="relative inline-block mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Main Logo Text */}
            <div className="relative">
              <GlitchText 
                text="SpamGPT" 
                className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500" 
              />
              
              {/* SGPT Badge */}
              <motion.div
                className="absolute -top-8 -right-8 md:-top-10 md:-right-10"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <div className="relative">
                  <motion.div
                    className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-red-600 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      boxShadow: [
                        "0 10px 40px rgba(255, 59, 75, 0.5)",
                        "0 20px 60px rgba(155, 59, 255, 0.7)",
                        "0 10px 40px rgba(255, 59, 75, 0.5)"
                      ]
                    }}
                    transition={{
                      rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                      boxShadow: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                    }}
                  >
                    <span className="text-white font-bold text-2xl md:text-3xl">SGPT</span>
                  </motion.div>
                  <Mail className="absolute -bottom-2 -right-2 w-8 h-8 text-white bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-1.5 shadow-lg" />
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Subtitle */}
          <motion.p 
            className="text-2xl md:text-3xl text-muted-foreground mb-8 max-w-4xl mx-auto font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Next-Gen AI-Powered Email Marketing Platform
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-4 text-lg"
            >
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}; 