import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SparkleEffect, MagicalBackground, GlowingIcon } from '@/components/ui/sparkle-effect';
import { 
  Zap, 
  Brain, 
  Sparkles, 
  Code2, 
  Wand2, 
  Activity,
  Bot,
  Cpu,
  Database,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const WizardThemeShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-wizard-primary-bg min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 relative">
          <MagicalBackground showSwirl={true} />
          <h1 className="text-5xl font-bold text-wizard-gradient animate-float">
            Wizard Tech Theme Showcase
          </h1>
          <p className="text-xl text-wizard-text">
            Experience the magical fusion of technology and mysticism
          </p>
        </div>

        {/* Color Palette */}
        <Card className="ai-feature-card">
          <CardHeader>
            <CardTitle className="text-wizard-gradient">Color Palette</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-wizard-primary-bg rounded-lg border border-wizard-border"></div>
              <p className="text-sm text-wizard-text">Primary BG<br />#0B0A17</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-wizard-secondary-bg rounded-lg border border-wizard-border"></div>
              <p className="text-sm text-wizard-text">Secondary BG<br />#15122B</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-wizard-primary-accent rounded-lg wizard-glow"></div>
              <p className="text-sm text-wizard-text">Electric Blue<br />#3AAFFF</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-wizard-secondary-accent rounded-lg wizard-glow-purple"></div>
              <p className="text-sm text-wizard-text">Rich Violet<br />#7B2FF7</p>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card className="ai-feature-card">
          <CardHeader>
            <CardTitle className="text-wizard-gradient">Buttons & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button className="btn-wizard-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Primary Action
              </Button>
              <Button className="btn-wizard-secondary">
                <Wand2 className="w-4 h-4 mr-2" />
                Secondary Action
              </Button>
              <Button className="bg-wizard-gradient text-white wizard-hover-glow">
                <Zap className="w-4 h-4 mr-2" />
                Gradient Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="ai-feature-card wizard-hover-glow">
            <MagicalBackground />
            <CardHeader className="relative z-10">
              <GlowingIcon color="blue" size="lg">
                <Brain className="w-6 h-6" />
              </GlowingIcon>
              <CardTitle className="text-wizard-gradient mt-4">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-wizard-text">
                Powered by advanced neural networks for intelligent automation
              </p>
              <Badge className="mt-4 bg-wizard-primary-accent/20 text-wizard-primary-accent border-wizard-primary-accent/50">
                Active
              </Badge>
            </CardContent>
          </Card>

          <Card className="ai-feature-card wizard-hover-glow">
            <MagicalBackground />
            <CardHeader className="relative z-10">
              <GlowingIcon color="purple" size="lg">
                <Bot className="w-6 h-6" />
              </GlowingIcon>
              <CardTitle className="text-wizard-gradient mt-4">Smart Bot</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-wizard-text">
                Intelligent conversational AI with magical capabilities
              </p>
              <Badge className="mt-4 bg-wizard-secondary-accent/20 text-wizard-secondary-accent border-wizard-secondary-accent/50">
                Premium
              </Badge>
            </CardContent>
          </Card>

          <Card className="ai-feature-card wizard-hover-glow">
            <MagicalBackground />
            <CardHeader className="relative z-10">
              <GlowingIcon color="blue" size="lg">
                <Cpu className="w-6 h-6" />
              </GlowingIcon>
              <CardTitle className="text-wizard-gradient mt-4">Neural Core</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-wizard-text">
                Advanced processing with quantum-enhanced algorithms
              </p>
              <Badge className="mt-4 bg-wizard-gradient text-white">
                Enhanced
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Effects Showcase */}
        <Card className="ai-feature-card">
          <CardHeader>
            <CardTitle className="text-wizard-gradient">Visual Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Glow Effects */}
            <div className="space-y-2">
              <h3 className="text-wizard-heading font-semibold">Glow Effects</h3>
              <div className="flex gap-4">
                <div className="p-4 wizard-glow rounded-lg bg-wizard-secondary-bg">
                  Blue Glow
                </div>
                <div className="p-4 wizard-glow-purple rounded-lg bg-wizard-secondary-bg">
                  Purple Glow
                </div>
                <div className="p-4 wizard-glow-lg rounded-lg bg-wizard-secondary-bg">
                  Large Glow
                </div>
              </div>
            </div>

            {/* Gradient Borders */}
            <div className="space-y-2">
              <h3 className="text-wizard-heading font-semibold">Gradient Borders</h3>
              <div className="flex gap-4">
                <div className="p-4 border-wizard-gradient rounded-lg">
                  Gradient Border
                </div>
                <div className="p-4 border-wizard-glow rounded-lg">
                  Glow Border
                </div>
              </div>
            </div>

            {/* Animations */}
            <div className="space-y-2">
              <h3 className="text-wizard-heading font-semibold">Animations</h3>
              <div className="flex gap-4">
                <div className="p-4 bg-wizard-secondary-bg rounded-lg animate-float">
                  Floating
                </div>
                <div className="p-4 bg-wizard-secondary-bg rounded-lg animate-pulse-glow wizard-glow">
                  Pulse Glow
                </div>
                <div className="p-4 bg-wizard-secondary-bg rounded-lg wizard-shimmer">
                  Shimmer
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Examples */}
        <Card className="ai-feature-card">
          <CardHeader>
            <CardTitle className="text-wizard-gradient">Form Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Magical input field..." 
              className="bg-wizard-secondary-bg border-wizard-border focus:border-wizard-primary-accent focus:ring-wizard-primary-accent/50"
            />
            <div className="relative">
              <Input 
                placeholder="Search with glow effect..." 
                className="bg-wizard-secondary-bg border-wizard-border wizard-glow-sm pl-10"
              />
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wizard-primary-accent" />
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card className="ai-feature-card">
          <CardHeader>
            <CardTitle className="text-wizard-gradient">Loading States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-wizard-gradient animate-swirl"></div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-wizard-primary-accent animate-sparkle"></div>
                <div className="w-3 h-3 rounded-full bg-wizard-secondary-accent animate-sparkle" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-3 h-3 rounded-full bg-wizard-primary-accent animate-sparkle" style={{ animationDelay: '1s' }}></div>
              </div>
              <div className="px-4 py-2 bg-wizard-secondary-bg rounded-lg wizard-loading-pulse">
                Loading...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WizardThemeShowcase;