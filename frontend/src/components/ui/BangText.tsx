/**
 * 💥 BangText Component
 * Reusable component that applies a dynamic bang effect to text
 * Perfect for SpamGPT branding with customizable intensity and timing
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

interface BangTextProps {
    text: string;
    className?: string;
    autoTrigger?: boolean;
    triggerInterval?: number;
    bangIntensity?: number;
    showSparkles?: boolean;
    showZap?: boolean;
    onBangComplete?: () => void;
}

export const BangText: React.FC<BangTextProps> = ({
    text,
    className = "",
    autoTrigger = true,
    triggerInterval = 3000,
    bangIntensity = 1.3,
    showSparkles = true,
    showZap = true,
    onBangComplete
}) => {
    const [bangIndex, setBangIndex] = useState(0);
    const [isBanging, setIsBanging] = useState(false);

    // Create bang sequence for each character
    const bangSequence = text.split('').map((char, index) => ({
        char,
        delay: index * 0.1,
        intensity: bangIntensity + (Math.random() * 0.4 - 0.2), // Slight variation
        index
    }));

    // Trigger bang effect
    const triggerBang = () => {
        setIsBanging(true);
        setBangIndex(0);

        setTimeout(() => {
            setIsBanging(false);
            onBangComplete?.();
        }, text.length * 100 + 500);
    };

    // Auto-trigger bang effect
    useEffect(() => {
        if (!autoTrigger) return;

        const bangInterval = setInterval(triggerBang, triggerInterval);
        return () => clearInterval(bangInterval);
    }, [autoTrigger, triggerInterval, text.length]);

    // Bang effect animation variants
    const bangVariants = {
        initial: {
            scale: 1,
            rotate: 0,
            filter: 'brightness(1)',
            textShadow: '0 0 0px currentColor'
        },
        bang: (custom: { intensity: number; delay: number }) => ({
            scale: custom.intensity,
            rotate: [0, -8, 8, -4, 4, 0],
            filter: 'brightness(1.8)',
            textShadow: [
                '0 0 0px currentColor',
                '0 0 20px currentColor',
                '0 0 40px currentColor',
                '0 0 20px currentColor',
                '0 0 0px currentColor'
            ],
            transition: {
                duration: 0.4,
                delay: custom.delay,
                ease: "easeInOut"
            }
        }),
        exit: {
            scale: 1,
            rotate: 0,
            filter: 'brightness(1)',
            textShadow: '0 0 0px currentColor'
        }
    };

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            {/* Main Text with Individual Character Bang Effects */}
            {bangSequence.map((item) => (
                <motion.span
                    key={item.index}
                    className="inline-block relative"
                    custom={item}
                    variants={bangVariants}
                    initial="initial"
                    animate={isBanging && bangIndex >= item.index ? "bang" : "initial"}
                    exit="exit"
                    onAnimationComplete={() => {
                        if (isBanging && bangIndex === item.index) {
                            setTimeout(() => setBangIndex(item.index + 1), 100);
                        }
                    }}
                >
                    {item.char}

                    {/* Sparkle effect on bang */}
                    {showSparkles && (
                        <AnimatePresence>
                            {isBanging && bangIndex === item.index && (
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </motion.span>
            ))}

            {/* Bang Effect Indicator */}
            {showZap && (
                <motion.div
                    className="absolute -top-2 -right-2 w-5 h-5 text-yellow-400"
                    animate={{
                        scale: isBanging ? [1, 1.5, 1] : 1,
                        rotate: isBanging ? [0, 180, 360] : 0,
                        opacity: isBanging ? [1, 0.8, 1] : 0.6
                    }}
                    transition={{ duration: 0.5 }}
                >
                    <Zap className="w-full h-full" />
                </motion.div>
            )}

            {/* Manual Trigger Button (when autoTrigger is false) */}
            {!autoTrigger && (
                <motion.button
                    className="ml-2 p-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={triggerBang}
                    title="Trigger bang effect"
                >
                    <Zap className="w-4 h-4" />
                </motion.button>
            )}
        </div>
    );
};

// Specialized SpamGPT BangText component
export const SpamGPTBangText: React.FC<Omit<BangTextProps, 'text'> & {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'hero' | 'compact';
}> = ({
    size = 'md',
    variant = 'default',
    className = "",
    ...props
}) => {
        const sizeClasses = {
            sm: 'text-2xl md:text-3xl',
            md: 'text-4xl md:text-5xl',
            lg: 'text-6xl md:text-7xl',
            xl: 'text-7xl md:text-9xl'
        };

        const variantClasses = {
            default: 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500',
            hero: 'font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500',
            compact: 'font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500'
        };

        return (
            <BangText
                text="SpamGPT"
                className={`${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
                bangIntensity={variant === 'hero' ? 1.5 : 1.3}
                triggerInterval={variant === 'hero' ? 3000 : 5000}
                {...props}
            />
        );
    };
