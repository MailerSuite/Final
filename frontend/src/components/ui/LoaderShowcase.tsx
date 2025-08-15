/**
 * Loader Showcase - Demo page for testing different loader variants
 */

import React from 'react';
import PremiumMailLoader from './PremiumMailLoader';
import CircularTransitionLoader from './CircularTransitionLoader';

const LoaderShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Premium Mail Loader Showcase</h1>
          <p className="text-muted-foreground">Test all variants and sizes of our new animated loader</p>
        </div>

        {/* Size variations */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Size Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-4">Small</h3>
              <PremiumMailLoader size="sm" showText={false} />
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-4">Medium</h3>
              <PremiumMailLoader size="md" showText={false} />
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-4">Large</h3>
              <PremiumMailLoader size="lg" showText={false} />
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-4">Extra Large</h3>
              <PremiumMailLoader size="xl" showText={false} />
            </div>
          </div>
        </section>

        {/* Variant styles */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Style Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-6">Default</h3>
              <PremiumMailLoader 
                size="md" 
                variant="default" 
                showText={true}
                text="Loading..."
              />
            </div>
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-6">Minimal</h3>
              <PremiumMailLoader 
                size="md" 
                variant="minimal" 
                showText={true}
                text="Processing..."
              />
            </div>
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-6">Full</h3>
              <PremiumMailLoader 
                size="md" 
                variant="full" 
                showText={true}
                text="Sending emails..."
              />
            </div>
          </div>
        </section>

        {/* Text variations */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Text Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-6">With Custom Text</h3>
              <PremiumMailLoader 
                size="lg" 
                variant="full" 
                showText={true}
                text="Connecting to SMTP server..."
              />
            </div>
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-6">Without Text</h3>
              <PremiumMailLoader 
                size="lg" 
                variant="full" 
                showText={false}
              />
            </div>
          </div>
        </section>

        {/* Real usage examples */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Page loading */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border border-border rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
              <PremiumMailLoader 
                size="lg" 
                variant="full" 
                showText={true}
                text="Loading MailerSuite Dashboard..."
              />
            </div>
            
            {/* Inline loading */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-lg font-medium mb-4">Campaign Analytics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Campaign Performance</span>
                  <PremiumMailLoader size="sm" showText={false} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email Delivery Status</span>
                  <PremiumMailLoader size="sm" showText={false} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">SMTP Health Check</span>
                  <PremiumMailLoader size="sm" showText={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Circular Transition Loaders */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Circular Transition Loaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border border-border rounded-lg p-8 text-center min-h-[300px] flex flex-col justify-center">
              <h3 className="text-lg font-medium mb-6 text-white">Minimal</h3>
              <CircularTransitionLoader size="md" variant="minimal" />
            </div>
            <div className="bg-background border border-border rounded-lg p-8 text-center min-h-[300px] flex flex-col justify-center">
              <h3 className="text-lg font-medium mb-6 text-white">Standard</h3>
              <CircularTransitionLoader size="md" variant="standard" />
            </div>
            <div className="bg-background border border-border rounded-lg p-8 text-center min-h-[300px] flex flex-col justify-center">
              <h3 className="text-lg font-medium mb-6 text-white">Magical AI</h3>
              <CircularTransitionLoader size="md" variant="magical" />
            </div>
          </div>
        </section>

        {/* Dark/Magical AI theme showcase */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Dark/Magical AI Style</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 border border-blue-800/50 rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
              <PremiumMailLoader 
                size="md" 
                variant="full" 
                showText={true}
                text="Magical AI Loading..."
              />
            </div>
            <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-blue-950 border border-purple-800/50 rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
              <CircularTransitionLoader size="md" variant="magical" />
            </div>
          </div>
        </section>

        {/* Fullscreen transition demo */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-foreground">Fullscreen Transition Preview</h2>
          <div className="relative bg-background border border-border rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <CircularTransitionLoader size="fullscreen" variant="magical" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white z-10">
                <h3 className="text-2xl font-bold mb-2">Page Transition</h3>
                <p className="text-muted-foreground">This is how the loader appears during page transitions</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoaderShowcase;