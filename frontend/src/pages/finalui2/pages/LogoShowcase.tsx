/**
 * Logo Showcase Page
 * Demonstrates all animated logo variants with unified design system
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Logo, LogoVariants } from '@/components/branding/Logo';
import PageShell from '@/pages/finalui2/components/PageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui/badge';

const LogoShowcase: React.FC = () => {
  const variants = [
    { name: 'Full Logo', variant: 'full', size: 'lg' },
    { name: 'Icon Only', variant: 'icon', size: 'xl' },
    { name: 'Text Only', variant: 'text', size: 'lg' },
    { name: 'Compact', variant: 'compact', size: 'md' },
    { name: 'Hero', variant: 'hero', size: '2xl' }
  ];

  const sizes = [
    { name: 'Small', size: 'sm' },
    { name: 'Medium', size: 'md' },
    { name: 'Large', size: 'lg' },
    { name: 'Extra Large', size: 'xl' },
    { name: '2XL', size: '2xl' }
  ];

  const logoVariants = [
    { name: 'Minimal', component: LogoVariants.Minimal },
    { name: 'Icon with Badge', component: LogoVariants.IconWithBadge },
    { name: 'Text Only', component: LogoVariants.TextOnly }
  ];

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Logo Showcase
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore all animated logo variants using our unified design system colors
          </p>
        </motion.div>

        {/* Main Logo Variants */}
        <section className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-semibold text-foreground"
          >
            Main Logo Variants
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {variants.map((variant, index) => (
              <motion.div
                key={variant.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-center">{variant.name}</CardTitle>
                    <CardDescription className="text-center">
                      {variant.variant} variant, {variant.size} size
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center min-h-[120px]">
                    <Logo
                      variant={variant.variant as any}
                      size={variant.size as any}
                      animated={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Size Variations */}
        <section className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl font-semibold text-foreground"
          >
            Size Variations
          </motion.h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Full Logo - All Sizes</CardTitle>
              <CardDescription>
                See how the logo scales across different size variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-8 py-8">
                {sizes.map((size, index) => (
                  <motion.div
                    key={size.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Logo
                      variant="full"
                      size={size.size as any}
                      animated={true}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {size.name}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alternative Logo Variants */}
        <section className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-2xl font-semibold text-foreground"
          >
            Alternative Logo Variants
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {logoVariants.map((variant, index) => (
              <motion.div
                key={variant.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-center">{variant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center min-h-[100px]">
                    <variant.component />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Brand Colors */}
        <section className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-2xl font-semibold text-foreground"
          >
            Brand Color System
          </motion.h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Design System Color Palette</CardTitle>
              <CardDescription>
                The logo uses these unified design system colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="w-full h-16 bg-primary rounded-lg border border-border"></div>
                  <p className="text-sm font-medium text-center">Primary</p>
                  <p className="text-xs text-muted-foreground text-center">Electric Blue</p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full h-16 bg-secondary rounded-lg border border-border"></div>
                  <p className="text-sm font-medium text-center">Secondary</p>
                  <p className="text-xs text-muted-foreground text-center">Cyan</p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full h-16 bg-accent rounded-lg border border-border"></div>
                  <p className="text-sm font-medium text-center">Accent</p>
                  <p className="text-xs text-muted-foreground text-center">Purple</p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full h-16 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg border border-border"></div>
                  <p className="text-sm font-medium text-center">Gradient</p>
                  <p className="text-xs text-muted-foreground text-center">Primary → Secondary → Accent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Interactive Demo */}
        <section className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-2xl font-semibold text-foreground"
          >
            Interactive Demo
          </motion.h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Hover Effects & Animations</CardTitle>
              <CardDescription>
                Hover over the logos to see interactive animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-8 py-8">
                <Logo variant="icon" size="xl" animated={true} />
                <Logo variant="full" size="lg" animated={true} />
                <Logo variant="compact" size="md" animated={true} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Code Example */}
        <section className="space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-2xl font-semibold text-foreground"
          >
            Usage Examples
          </motion.h2>
          
          <Card>
            <CardHeader>
              <CardTitle>How to Use the Logo Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Basic Usage:</h4>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`import { Logo } from '@/components/branding/Logo';

// Default full logo
<Logo />

// Icon only
<Logo variant="icon" size="xl" />

// Hero variant for landing pages
<Logo variant="hero" size="2xl" />`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">With Custom Styling:</h4>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`// Custom className
<Logo className="my-custom-class" />

// Clickable logo
<Logo onClick={() => navigate('/')} />

// Disable animations
<Logo animated={false} />`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageShell>
  );
};

export default LogoShowcase; 