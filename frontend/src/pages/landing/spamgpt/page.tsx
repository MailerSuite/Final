import React from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { BackgroundEffects } from '@/components/ui/BackgroundEffects';
import { GradientOrbs } from '@/components/landing/animations/GradientOrbs';
import { MatrixRain } from '@/components/landing/animations/MatrixRain';
import { SpamGPTHero } from '@/components/landing/spamgpt/SpamGPTHero';
import { HeroFeatures, HeroTitle, HeroSubtitle, HeroCTA } from '@/components/landing/hero';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CpuChipIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    RocketLaunchIcon,
    BoltIcon,
    EnvelopeIcon,
    ServerStackIcon,
    UsersIcon,
    CheckCircleIcon,
    CursorArrowRaysIcon,
    SparklesIcon,
    RectangleGroupIcon,
} from '@heroicons/react/24/outline';

const features = [
    {
        title: 'AI Email Optimizer',
        description: 'Generate, score, and improve emails with real-time AI feedback to maximize deliverability and engagement.',
        icon: <BoltIcon className="w-6 h-6" />,
    },
    {
        title: 'Campaign Management',
        description: 'Plan, launch, and analyze campaigns with powerful workflows, segmentation, and automation.',
        icon: <EnvelopeIcon className="w-6 h-6" />,
    },
    {
        title: 'Real-time Analytics',
        description: 'Track opens, clicks, and revenue with live dashboards and alerting.',
        icon: <ChartBarIcon className="w-6 h-6" />,
    },
    {
        title: 'SMTP/IMAP Tooling',
        description: 'Validate servers, test inbox placement, and monitor health at scale.',
        icon: <ServerStackIcon className="w-6 h-6" />,
    },
    {
        title: 'Proxy Management',
        description: 'Advanced proxy configuration and rotation for reliable, scalable sending.',
        icon: <CpuChipIcon className="w-6 h-6" />,
    },
    {
        title: 'Team Collaboration',
        description: 'Roles, permissions, and shared workspaces to move faster together.',
        icon: <UsersIcon className="w-6 h-6" />,
    },
];

const demoCards = [
    {
        title: 'AI Email Optimizer (Demo)',
        description: 'Try the AI-powered wizard that analyzes and improves your emails instantly.',
        path: '/landing/spamgpt/demo/optimizer',
        color: 'from-indigo-500 to-purple-600',
        icon: <BoltIcon className="w-5 h-5" />,
    },
    {
        title: 'Analytics Dashboard (Demo)',
        description: 'Explore live-style analytics and monitoring with simulated data.',
        path: '/landing/spamgpt/demo/analytics',
        color: 'from-blue-500 to-cyan-600',
        icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
        title: 'SpamGPT AI Tutor (Demo)',
        description: 'Learn inboxing, server setup, and scaling strategies with our AI Tutor.',
        path: '/landing/spamgpt/demo/tutor',
        color: 'from-fuchsia-500 to-pink-600',
        icon: <RocketLaunchIcon className="w-5 h-5" />,
    },
    {
        title: 'Campaign Wizard (Demo)',
        description: 'See how easy it is to plan and launch a campaign in minutes.',
        path: '/landing/spamgpt/demo/campaign-wizard',
        color: 'from-violet-500 to-purple-600',
        icon: <CursorArrowRaysIcon className="w-5 h-5" />,
    },
    {
        title: 'Content Generator (Demo)',
        description: 'Generate high-converting subject lines and body copy on the fly.',
        path: '/landing/spamgpt/demo/content-generator',
        color: 'from-sky-500 to-indigo-600',
        icon: <SparklesIcon className="w-5 h-5" />,
    },
    {
        title: 'SMTP & Deliverability (Demo)',
        description: 'Validate SMTP, test inbox placement, and monitor deliverability.',
        path: '/landing/spamgpt/demo/smtp',
        color: 'from-emerald-500 to-teal-600',
        icon: <ShieldCheckIcon className="w-5 h-5" />,
    },
    {
        title: 'Deliverability Dashboard (Demo)',
        description: 'Understand reputation, spam triggers, and how to fix them.',
        path: '/landing/spamgpt/demo/deliverability',
        color: 'from-rose-500 to-orange-600',
        icon: <CheckCircleIcon className="w-5 h-5" />,
    },
    {
        title: 'AI Assistant (Demo)',
        description: 'Chat with an AI assistant that helps you execute tasks end-to-end.',
        path: '/landing/spamgpt/demo/assistant',
        color: 'from-purple-500 to-cyan-600',
        icon: <SparklesIcon className="w-5 h-5" />,
    },
    {
        title: 'Live Console (Demo)',
        description: 'Watch simulated logs and system events streaming in real-time.',
        path: '/landing/spamgpt/demo/live-console',
        color: 'from-amber-500 to-yellow-600',
        icon: <BoltIcon className="w-5 h-5" />,
    },
    {
        title: 'Template Builder (Demo)',
        description: 'Drag-and-drop email builder with AI blocks and responsive preview.',
        path: '/landing/spamgpt/demo/template-builder',
        color: 'from-indigo-600 to-sky-600',
        icon: <RectangleGroupIcon className="w-5 h-5" />,
    },
];

const SpamGPTLandingPage: React.FC = () => {
    return (
        <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-foreground">
            <BackgroundEffects className="opacity-90" />
            <GradientOrbs />
            <MatrixRain />

            <div className="relative z-10 flex flex-col min-h-screen">
                <LandingHeader />

                <main className="flex-1">
                    {/* Hero */}
                    <section className="relative">
                        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
                        <SpamGPTHero />
                    </section>

                    {/* Sub-hero CTA */}
                    <section className="container mx-auto px-4 pb-16 -mt-8">
                        <div className="rounded-2xl border bg-background/50 backdrop-blur p-6 md:p-8">
                            <div className="flex flex-col items-center text-center">
                                <Badge className="mb-3 bg-gradient-to-r from-indigo-500 to-purple-600">Dark • Blue • Purple • Wizard AI</Badge>
                                <HeroTitle className="bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                                    The AI Email Platform for High-Performance Teams
                                </HeroTitle>
                                <HeroSubtitle className="max-w-2xl">
                                    Build, optimize, and scale campaigns with SpamGPT—your AI co-pilot for email deliverability, content, and analytics.
                                </HeroSubtitle>
                                <HeroCTA
                                    primaryText="Start Free Trial"
                                    secondaryText="View Pricing"
                                    onPrimaryClick={() => (window.location.href = '/sign-up')}
                                    onSecondaryClick={() => (window.location.href = '/pricing')}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Benefits Section */}
                    <section className="container mx-auto px-4 py-12">
                        <div className="text-center mb-10">
                            <Badge variant="secondary" className="mb-3">Why SpamGPT</Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Don’t know how to inbox? We make it effortless.</h2>
                            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
                                You focus on your product—we handle the complex parts: server health, content optimization, reputation, and analytics. Start sending confident, high-performing campaigns today.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-card/60 backdrop-blur border border-border/60">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-400" /> No Experience Required</CardTitle>
                                    <CardDescription>Guided wizards, best-practice templates, and AI prompts do the heavy lifting for you.</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className="bg-card/60 backdrop-blur border border-border/60">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-sky-400" /> Deliverability Built-In</CardTitle>
                                    <CardDescription>Reputation checks, spam trigger detection, and inbox testing baked into your workflow.</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card className="bg-card/60 backdrop-blur border border-border/60">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-400" /> Function-Powered</CardTitle>
                                    <CardDescription>Composable functions automate setup, scoring, testing, and sending—so you move faster.</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </section>

                    {/* Features */}
                    <section className="container mx-auto px-4 py-12">
                        <div className="text-center mb-10">
                            <Badge variant="secondary" className="mb-3">Platform Highlights</Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything you need to inbox and scale</h2>
                        </div>
                        <HeroFeatures items={features} />
                    </section>

                    {/* Live Demos */}
                    <section className="container mx-auto px-4 py-12">
                        <div className="text-center mb-10">
                            <Badge variant="secondary" className="mb-3">Interactive</Badge>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Try it yourself</h2>
                            <p className="text-muted-foreground mt-2">Launch fully interactive demos—no signup required.</p>
                        </div>

                        {/* Demo Controls */}
                        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                            <div className="text-sm text-muted-foreground">Live demo instances run in read-only mode. Actions that send, delete, or purchase are disabled.</div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Preview density</span>
                                <div className="inline-flex items-center gap-2">
                                    <Button size="sm" variant="outline" data-demo-allow="true">Compact</Button>
                                    <Button size="sm" variant="outline" data-demo-allow="true">Comfortable</Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {demoCards.map((demo) => (
                                <Card key={demo.path} className="bg-card/60 backdrop-blur border border-border/60">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${demo.color}`}>{demo.icon}</span>
                                            {demo.title}
                                        </CardTitle>
                                        <CardDescription>{demo.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between">
                                        <Link to={demo.path} aria-label={`${demo.title} – Launch`}>
                                            <Button className={`bg-gradient-to-r ${demo.color} text-white`}>Launch Demo</Button>
                                        </Link>
                                        <Link to={demo.path} className="text-sm text-muted-foreground hover:text-foreground" aria-label={`${demo.title} – Learn more`}>
                                            Learn more →
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* CTA Strip */}
                    <section className="container mx-auto px-4 py-16">
                        <div className="rounded-2xl border bg-gradient-to-r from-indigo-950/60 via-slate-950/60 to-purple-950/60 p-8 md:p-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-bold">Ready to ship with SpamGPT?</h3>
                                    <p className="text-muted-foreground">Get started in minutes with our modern, familiar interface.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600">Get Started</Button>
                                    <Button variant="outline" asChild>
                                        <Link to="/contact">Talk to Sales</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <LandingFooter />
            </div>
        </div>
    );
};

export default SpamGPTLandingPage;
