/**
 * Logo Demo Component
 * Quick showcase of logo variants for testing and demonstration
 */

import React, { useState } from 'react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Sparkles, Shield } from 'lucide-react';

interface LogoDemoProps {
  className?: string;
}

const LogoDemo: React.FC<LogoDemoProps> = ({ className }) => {
  const [currentVariant, setCurrentVariant] = useState<'full' | 'icon' | 'text' | 'compact' | 'hero'>('full');
  const [currentSize, setCurrentSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');
  const [isAnimated, setIsAnimated] = useState(true);

  const variants = [
    { value: 'full', label: 'Full', description: 'Icon + Text' },
    { value: 'icon', label: 'Icon', description: 'Icon only' },
    { value: 'text', label: 'Text', description: 'Text only' },
    { value: 'compact', label: 'Compact', description: 'Small icon + text' },
    { value: 'hero', label: 'Hero', description: 'Large hero version' }
  ];

  const sizes = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'XL' },
    { value: '2xl', label: '2XL' }
  ];

  return (
    <div className={className}>
      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Logo Demo Controls
          </CardTitle>
          <CardDescription>
            Customize the logo display with these controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variant Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Logo Variant
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <Button
                  key={variant.value}
                  variant={currentVariant === variant.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentVariant(variant.value as any)}
                  className="text-xs"
                >
                  {variant.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {variant.description}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Logo Size
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Button
                  key={size.value}
                  variant={currentSize === size.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentSize(size.value as any)}
                  className="text-xs"
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Animation Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant={isAnimated ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsAnimated(!isAnimated)}
              className="flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isAnimated ? 'animate-pulse' : ''}`} />
              {isAnimated ? 'Animated' : 'Static'}
            </Button>
            
            <Badge variant="outline" className="text-xs">
              {isAnimated ? 'Animations enabled' : 'Animations disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Logo Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Logo Preview
          </CardTitle>
          <CardDescription>
            Current: {currentVariant} variant, {currentSize} size, {isAnimated ? 'animated' : 'static'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center min-h-[200px] p-8 bg-gradient-to-br from-background to-surface-1 rounded-lg border border-border">
            <Logo
              variant={currentVariant}
              size={currentSize}
              animated={isAnimated}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Examples */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Header Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Logo variant="full" size="md" animated={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sidebar Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Logo variant="icon" size="lg" animated={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Footer Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Logo variant="text" size="sm" animated={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Favicon Style</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Logo variant="icon" size="sm" animated={false} />
          </CardContent>
        </Card>
      </div>

      {/* Color Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            Design System Colors
          </CardTitle>
          <CardDescription>
            The logo uses these unified design system colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2 border border-border"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">Electric Blue</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2 border border-border"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">Cyan</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-lg mx-auto mb-2 border border-border"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">Purple</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoDemo; 