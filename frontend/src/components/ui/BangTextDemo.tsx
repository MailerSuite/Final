/**
 * 💥 BangText Demo Component
 * Showcases the BangText component with different configurations
 * Perfect for testing and demonstrating the SpamGPT bang effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BangText, SpamGPTBangText } from './BangText';

export const BangTextDemo: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">
                        💥 BangText Component Demo
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Experience the dynamic bang effects for SpamGPT branding and beyond.
                        Each character animates with customizable intensity and timing.
                    </p>
                </motion.div>

                {/* SpamGPT Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="mb-16 p-8 bg-gradient-to-r from-red-900/20 to-purple-900/20 rounded-2xl border border-red-500/30"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        🚀 SpamGPT Hero Branding
                    </h2>

                    <div className="flex justify-center mb-8">
                        <SpamGPTBangText
                            size="xl"
                            variant="hero"
                            autoTrigger={true}
                            triggerInterval={3000}
                            bangIntensity={1.5}
                        />
                    </div>

                    <p className="text-center text-gray-300">
                        Hero variant with maximum impact - triggers every 3 seconds
                    </p>
                </motion.section>

                {/* Different Sizes */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="mb-16 p-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-2xl border border-blue-500/30"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        📏 Different Sizes
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-300 mb-4">Small</h3>
                            <SpamGPTBangText size="sm" variant="default" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-300 mb-4">Medium</h3>
                            <SpamGPTBangText size="md" variant="default" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-300 mb-4">Large</h3>
                            <SpamGPTBangText size="lg" variant="default" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-300 mb-4">Extra Large</h3>
                            <SpamGPTBangText size="xl" variant="default" />
                        </div>
                    </div>
                </motion.section>

                {/* Custom Text Examples */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mb-16 p-8 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-2xl border border-green-500/30"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        ✨ Custom Text Examples
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-green-300 mb-4">"BOOM!" Effect</h3>
                            <BangText
                                text="BOOM!"
                                className="text-4xl font-bold text-yellow-400"
                                autoTrigger={true}
                                triggerInterval={4000}
                                bangIntensity={1.4}
                            />
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-green-300 mb-4">"POW!" Effect</h3>
                            <BangText
                                text="POW!"
                                className="text-4xl font-bold text-orange-400"
                                autoTrigger={true}
                                triggerInterval={5000}
                                bangIntensity={1.6}
                            />
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-green-300 mb-4">"ZAP!" Effect</h3>
                            <BangText
                                text="ZAP!"
                                className="text-4xl font-bold text-cyan-400"
                                autoTrigger={true}
                                triggerInterval={6000}
                                bangIntensity={1.3}
                            />
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-green-300 mb-4">"KABOOM!" Effect</h3>
                            <BangText
                                text="KABOOM!"
                                className="text-3xl font-bold text-red-400"
                                autoTrigger={true}
                                triggerInterval={7000}
                                bangIntensity={1.5}
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Manual Trigger Examples */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mb-16 p-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        🎮 Manual Trigger Examples
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-purple-300 mb-4">Manual SpamGPT</h3>
                            <SpamGPTBangText
                                size="lg"
                                variant="compact"
                                autoTrigger={false}
                                showZap={true}
                                showSparkles={true}
                            />
                            <p className="text-sm text-gray-400 mt-2">
                                Click the zap button to trigger manually
                            </p>
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-purple-300 mb-4">Manual "WOW!"</h3>
                            <BangText
                                text="WOW!"
                                className="text-4xl font-bold text-pink-400"
                                autoTrigger={false}
                                showZap={true}
                                showSparkles={true}
                            />
                            <p className="text-sm text-gray-400 mt-2">
                                Click the zap button to trigger manually
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Configuration Options */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                    className="p-8 bg-gradient-to-r from-slate-800/20 to-gray-800/20 rounded-2xl border border-gray-500/30"
                >
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        ⚙️ Configuration Options
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                        <div className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">autoTrigger</h4>
                            <p className="text-gray-300">Enable/disable automatic triggering</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">triggerInterval</h4>
                            <p className="text-gray-300">Time between auto-triggers (ms)</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">bangIntensity</h4>
                            <p className="text-gray-300">Scale factor for bang effect</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">showSparkles</h4>
                            <p className="text-gray-300">Show sparkle effects on bang</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">showZap</h4>
                            <p className="text-gray-300">Show zap indicator icon</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-white mb-2">onBangComplete</h4>
                            <p className="text-gray-300">Callback when bang effect finishes</p>
                        </div>
                    </div>
                </motion.section>

                {/* Footer */}
                <motion.footer
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="text-center mt-16"
                >
                    <p className="text-gray-400">
                        💥 BangText Component - Making SpamGPT branding more explosive!
                    </p>
                </motion.footer>
            </div>
        </div>
    );
};
