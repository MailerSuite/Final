import React from 'react';
import { SparkleEffect, MagicalBackground, GlowingIcon } from '@/components/ui/sparkle-effect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const WizardThemeShowcase: React.FC = () => {
    return (
        <div className="min-h-screen bg-wizard-gradient p-8">
            <SparkleEffect count={30} colors={['blue', 'secondary-blue']} />

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-bold text-wizard-gradient wizard-shimmer">
                        Wizard Tech Theme
                    </h1>
                    <p className="text-xl text-wizard-text max-w-2xl mx-auto">
                        Professional blue and dark blue magical interface with electric blue accents
                    </p>
                </div>

                {/* Color Palette */}
                <Card className="ai-feature-card">
                    <CardHeader>
                        <CardTitle className="text-wizard-gradient">Color Palette</CardTitle>
                        <CardDescription className="text-wizard-text">
                            Professional blue and dark blue theme with electric blue accents
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <div className="w-16 h-16 bg-wizard-primary-bg rounded-lg border border-wizard-border"></div>
                            <p className="text-sm text-wizard-text">Primary BG</p>
                            <p className="text-xs text-wizard-text opacity-70">#0A0F1C</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-16 h-16 bg-wizard-secondary-bg rounded-lg border border-wizard-border"></div>
                            <p className="text-sm text-wizard-text">Secondary BG</p>
                            <p className="text-xs text-wizard-text opacity-70">#111827</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-16 h-16 bg-wizard-primary-accent rounded-lg border border-wizard-border"></div>
                            <p className="text-sm text-wizard-text">Primary Accent</p>
                            <p className="text-xs text-wizard-text opacity-70">#3AAFFF</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-16 h-16 bg-wizard-secondary-accent rounded-lg border border-wizard-border"></div>
                            <p className="text-sm text-wizard-text">Secondary Accent</p>
                            <p className="text-xs text-wizard-text opacity-70">#1E40AF</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Themed Buttons */}
                <Card className="ai-feature-card">
                    <CardHeader>
                        <CardTitle className="text-wizard-gradient">Themed Buttons</CardTitle>
                        <CardDescription className="text-wizard-text">
                            Professional button styles with magical effects
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <Button className="btn-wizard-primary wizard-hover-glow">
                            Primary Button
                        </Button>
                        <Button className="btn-wizard-secondary wizard-hover-glow">
                            Secondary Button
                        </Button>
                        <Button variant="outline" className="border-wizard-glow text-wizard-primary-accent">
                            Outline Button
                        </Button>
                    </CardContent>
                </Card>

                {/* AI Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="ai-feature-card group">
                            <MagicalBackground>
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <GlowingIcon>
                                            <div className="w-8 h-8 bg-wizard-primary-accent rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold">AI</span>
                                            </div>
                                        </GlowingIcon>
                                        <CardTitle className="text-wizard-gradient">AI Feature {i}</CardTitle>
                                    </div>
                                    <CardDescription className="text-wizard-text">
                                        Magical AI-powered functionality with professional blue theme
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-wizard-text">
                                        Experience the power of AI with our magical interface design.
                                    </p>
                                </CardContent>
                            </MagicalBackground>
                        </Card>
                    ))}
                </div>

                {/* Visual Effects */}
                <Card className="ai-feature-card">
                    <CardHeader>
                        <CardTitle className="text-wizard-gradient">Visual Effects</CardTitle>
                        <CardDescription className="text-wizard-text">
                            Magical effects and animations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-6 bg-wizard-gradient-subtle rounded-lg wizard-glow">
                                <h4 className="text-wizard-primary-accent font-semibold mb-2">Glow Effect</h4>
                                <p className="text-wizard-text text-sm">Subtle blue glow with professional appeal</p>
                            </div>
                            <div className="p-6 bg-wizard-gradient-subtle rounded-lg border-wizard-gradient">
                                <h4 className="text-wizard-primary-accent font-semibold mb-2">Gradient Border</h4>
                                <p className="text-wizard-text text-sm">Beautiful gradient borders</p>
                            </div>
                            <div className="p-6 bg-wizard-gradient-subtle rounded-lg wizard-shimmer">
                                <h4 className="text-wizard-primary-accent font-semibold mb-2">Shimmer Effect</h4>
                                <p className="text-wizard-text text-sm">Animated shimmer animation</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form Elements */}
                <Card className="ai-feature-card">
                    <CardHeader>
                        <CardTitle className="text-wizard-gradient">Form Elements</CardTitle>
                        <CardDescription className="text-wizard-text">
                            Themed form components
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-wizard-text">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                className="bg-wizard-secondary-bg border-wizard-border text-wizard-text placeholder:text-wizard-text/50 focus:border-wizard-primary-accent focus:ring-wizard-primary-accent"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-wizard-text">Message</Label>
                            <Input
                                id="message"
                                placeholder="Enter your message"
                                className="bg-wizard-secondary-bg border-wizard-border text-wizard-text placeholder:text-wizard-text/50 focus:border-wizard-primary-accent focus:ring-wizard-primary-accent"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Loading States */}
                <Card className="ai-feature-card">
                    <CardHeader>
                        <CardTitle className="text-wizard-gradient">Loading States</CardTitle>
                        <CardDescription className="text-wizard-text">
                            Magical loading animations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="w-4 h-4 bg-wizard-primary-accent rounded-full wizard-loading-pulse"></div>
                            <div className="w-4 h-4 bg-wizard-secondary-accent rounded-full wizard-loading-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-4 h-4 bg-wizard-primary-accent rounded-full wizard-loading-pulse" style={{ animationDelay: '0.4s' }}></div>
                            <span className="text-wizard-text">Loading...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
