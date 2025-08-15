/**
 * 🚀 SpamGPT Hero Section
 * Main hero section with SpamGPT branding and animations
 * Enhanced with dynamic bang effect on the entire SpamGPT text
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpamGPTBanner } from './SpamGPTBanner';
import { SpamGPTBangText } from '@/components/ui/BangText';

export const SpamGPTHero: React.FC = () => {
  return (
    <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.5, 1, 1.5],
            opacity: [0.4, 0.7, 0.4],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      {/* SpamGPT ASCII Banner */}
      <SpamGPTBanner />

      <div className="max-w-7xl mx-auto text-center relative">
        <motion.div
          className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Enhanced SpamGPT Logo with Bang Effect */}
          <motion.div
            className="relative inline-block mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Main Logo Text with Bang Effect */}
            <div className="relative flex items-center justify-center">
              <SpamGPTBangText
                size="xl"
                variant="hero"
                autoTrigger={true}
                triggerInterval={3000}
                bangIntensity={1.5}
                showSparkles={true}
                showZap={true}
                onBangComplete={() => console.log('SpamGPT bang effect completed!')}
              />
            </div>

            {/* Enhanced SGPT Badge */}
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
          </motion.div>

          {/* Enhanced Subtitle */}
          <motion.p
            className="text-2xl md:text-3xl text-muted-foreground mb-8 max-w-4xl mx-auto font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Next-Gen AI-Powered Email Marketing Platform
          </motion.p>

          {/* Enhanced CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white px-8 py-4 text-lg relative overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">Start Free Trial</span>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-4 text-lg transition-all duration-300"
              >
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}; 