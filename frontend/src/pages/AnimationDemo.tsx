import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    FadeInUp,
    FadeInLeft,
    FadeInRight,
    SlideInFromTop,
    SlideInFromBottom,
    StaggerContainer,
    StaggerItem,
    PageTransition,
    StaggeredPageContent
} from '@/components/ui/animations'
import { PageSection } from '@/components/ui/PageTransition'
import {
    AnimatedCard,
    AnimatedCardWithHeader,
    AnimatedCardGrid
} from '@/components/ui/AnimatedCard'
import { AnimatedModal, AnimatedModalWithHeader } from '@/components/ui/AnimatedModal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

const AnimationDemo: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false)
    const [headerModalOpen, setHeaderModalOpen] = useState(false)

    return (
        <PageTransition>
            <div className="space-y-8">
                <PageSection>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Animation Showcase
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Explore the subtle framer-motion animations throughout the application
                    </p>
                </PageSection>

                {/* Basic Animations */}
                <PageSection delay={0.1}>
                    <h2 className="text-2xl font-semibold mb-4">Basic Animations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FadeInUp delay={0.1}>
                            <div className="p-6 bg-card border border-border rounded-lg text-center">
                                <h3 className="font-medium mb-2">Fade In Up</h3>
                                <p className="text-sm text-muted-foreground">Smooth entrance from below</p>
                            </div>
                        </FadeInUp>

                        <FadeInLeft delay={0.2}>
                            <div className="p-6 bg-card border border-border rounded-lg text-center">
                                <h3 className="font-medium mb-2">Fade In Left</h3>
                                <p className="text-sm text-muted-foreground">Slide in from the left</p>
                            </div>
                        </FadeInLeft>

                        <FadeInRight delay={0.3}>
                            <div className="p-6 bg-card border border-border rounded-lg text-center">
                                <h3 className="font-medium mb-2">Fade In Right</h3>
                                <p className="text-sm text-muted-foreground">Slide in from the right</p>
                            </div>
                        </FadeInRight>

                        <SlideInFromTop delay={0.4}>
                            <div className="p-6 bg-card border border-border rounded-lg text-center">
                                <h3 className="font-medium mb-2">Slide In Top</h3>
                                <p className="text-sm text-muted-foreground">Drop down from above</p>
                            </div>
                        </SlideInFromTop>
                    </div>
                </PageSection>

                {/* Staggered Animations */}
                <PageSection delay={0.2}>
                    <h2 className="text-2xl font-semibold mb-4">Staggered Animations</h2>
                    <StaggerContainer>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { icon: 'Rocket', title: 'Campaigns', desc: 'Launch email campaigns' },
                                { icon: 'BarChart3', title: 'Analytics', desc: 'Track performance metrics' },
                                { icon: 'Users', title: 'Contacts', desc: 'Manage your audience' }
                            ].map((item, index) => (
                                <StaggerItem key={index}>
                                    <div className="p-6 bg-card border border-border rounded-lg text-center hover:shadow-lg transition-shadow">
                                        <Icon name={item.icon as any} size="lg" className="mx-auto mb-3 text-primary" ariaLabel={item.title} />
                                        <h3 className="font-medium mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                </StaggerItem>
                            ))}
                        </div>
                    </StaggerContainer>
                </PageSection>

                {/* Animated Cards */}
                <PageSection delay={0.3}>
                    <h2 className="text-2xl font-semibold mb-4">Animated Cards</h2>
                    <AnimatedCardGrid columns={3} gap={4}>
                        <AnimatedCard delay={0.1} hoverEffect="scale">
                            <div className="p-4">
                                <h3 className="font-medium mb-2">Hover Scale</h3>
                                <p className="text-sm text-muted-foreground">Card scales up on hover</p>
                            </div>
                        </AnimatedCard>

                        <AnimatedCard delay={0.2} hoverEffect="lift">
                            <div className="p-4">
                                <h3 className="font-medium mb-2">Hover Lift</h3>
                                <p className="text-sm text-muted-foreground">Card lifts up on hover</p>
                            </div>
                        </AnimatedCard>

                        <AnimatedCard delay={0.3} hoverEffect="glow">
                            <div className="p-4">
                                <h3 className="font-medium mb-2">Hover Glow</h3>
                                <p className="text-sm text-muted-foreground">Card glows on hover</p>
                            </div>
                        </AnimatedCard>
                    </AnimatedCardGrid>
                </PageSection>

                {/* Cards with Headers */}
                <PageSection delay={0.4}>
                    <h2 className="text-2xl font-semibold mb-4">Cards with Headers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatedCardWithHeader
                            title="Feature Card"
                            subtitle="With animated header"
                            icon={<Icon name="Star" size="base" ariaLabel="Feature" />}
                            actions={<Button size="sm">Action</Button>}
                            delay={0.1}
                        >
                            <p className="text-muted-foreground">
                                This card demonstrates the animated header with icon, title, subtitle, and action button.
                                All elements animate in sequence for a polished feel.
                            </p>
                        </AnimatedCardWithHeader>

                        <AnimatedCardWithHeader
                            title="Interactive Card"
                            subtitle="Click to see effects"
                            icon={<Icon name="Sparkles" size="base" ariaLabel="Interactive" />}
                            clickable
                            onClick={() => console.log('Card clicked!')}
                            delay={0.2}
                        >
                            <p className="text-muted-foreground">
                                This card is clickable and shows hover effects. Try hovering over it to see the subtle animations.
                            </p>
                        </AnimatedCardWithHeader>
                    </div>
                </PageSection>

                {/* Modal Triggers */}
                <PageSection delay={0.5}>
                    <h2 className="text-2xl font-semibold mb-4">Modal Animations</h2>
                    <div className="flex gap-4">
                        <Button onClick={() => setModalOpen(true)}>
                            Open Simple Modal
                        </Button>
                        <Button onClick={() => setHeaderModalOpen(true)} variant="outline">
                            Open Header Modal
                        </Button>
                    </div>
                </PageSection>

                {/* Performance Metrics */}
                <PageSection delay={0.6}>
                    <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Animation Duration', value: '< 0.3s', desc: 'Snappy feel' },
                            { label: 'Easing Function', value: 'Custom', desc: 'Smooth curves' },
                            { label: 'Stagger Delay', value: '0.1s', desc: 'Sequential timing' },
                            { label: 'Hover Response', value: '0.2s', desc: 'Quick feedback' }
                        ].map((metric, index) => (
                            <motion.div
                                key={index}
                                className="p-4 bg-card border border-border rounded-lg text-center"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
                                <div className="font-medium mb-1">{metric.label}</div>
                                <div className="text-sm text-muted-foreground">{metric.desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </PageSection>

                {/* Modals */}
                <AnimatedModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Simple Animated Modal</h3>
                        <p className="text-muted-foreground mb-4">
                            This modal demonstrates the smooth entrance and exit animations with backdrop blur.
                        </p>
                        <Button onClick={() => setModalOpen(false)}>Close</Button>
                    </div>
                </AnimatedModal>

                <AnimatedModalWithHeader
                    isOpen={headerModalOpen}
                    onClose={() => setHeaderModalOpen(false)}
                    title="Modal with Header"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setHeaderModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setHeaderModalOpen(false)}>
                                Confirm
                            </Button>
                        </>
                    }
                >
                    <p className="text-muted-foreground">
                        This modal shows the enhanced version with animated header, content, and footer sections.
                        Each part animates in sequence for a professional appearance.
                    </p>
                </AnimatedModalWithHeader>
            </div>
        </PageTransition>
    )
}

export default AnimationDemo
