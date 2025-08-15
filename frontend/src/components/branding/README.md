# MailerSuite Animated Logo System

A comprehensive, animated logo component system that perfectly matches our unified design system colors and cyberpunk theme.

## Features

- **5 Logo Variants**: Full, Icon, Text, Compact, and Hero
- **5 Size Options**: Small to 2XL with responsive scaling
- **Unified Design System**: Uses exact colors from `design-system-master.css`
- **Cyberpunk Effects**: Glowing rings, orbiting particles, and smooth animations
- **Framer Motion**: Smooth, performant animations with hover effects
- **TypeScript**: Fully typed with proper interfaces

## Color System

The logo uses these exact colors from your design system:

- **Primary**: Electric Blue (`--primary: #3b82f6`)
- **Secondary**: Cyan (`--secondary: #06b6d4`)
- **Accent**: Purple (`--accent: #a855f7`)
- **Background**: Deep Dark (`--background: #080c14`)
- **Surface**: Progressive depth system

## Usage

### Basic Logo

```tsx
import { Logo } from '@/components/branding/Logo';

// Default full logo
<Logo />

// Icon only
<Logo variant="icon" size="xl" />

// Hero variant for landing pages
<Logo variant="hero" size="2xl" />
```

### All Variants

```tsx
// Full logo (icon + text)
<Logo variant="full" size="lg" />

// Icon only
<Logo variant="icon" size="xl" />

// Text only
<Logo variant="text" size="lg" />

// Compact (small icon + text)
<Logo variant="compact" size="md" />

// Hero (large with extra effects)
<Logo variant="hero" size="2xl" />
```

### Size Options

```tsx
<Logo size="sm" />    // Small
<Logo size="md" />    // Medium
<Logo size="lg" />    // Large
<Logo size="xl" />    // Extra Large
<Logo size="2xl" />   // 2XL
```

### Animation Control

```tsx
// Enable animations (default)
<Logo animated={true} />

// Disable animations
<Logo animated={false} />

// Clickable logo
<Logo onClick={() => navigate('/')} />

// Custom styling
<Logo className="my-custom-class" />
```

## Alternative Logo Variants

```tsx
import { LogoVariants } from '@/components/branding/Logo';

// Minimal version
<LogoVariants.Minimal />

// Icon with badge
<LogoVariants.IconWithBadge />

// Text only
<LogoVariants.TextOnly size="lg" />
```

## Brand Colors

```tsx
import { BrandColors } from '@/components/branding/Logo';

// Use in your own components
<div className={`bg-gradient-to-r ${BrandColors.primaryToAccent}`}>
  Content
</div>
```

## Demo Components

### LogoShowcase Page

Visit `/logo-showcase` to see all variants in action with interactive controls.

### LogoDemo Component

```tsx
import { LogoDemo } from '@/components/branding/LogoDemo';

// Interactive demo with controls
<LogoDemo />
```

## Design System Integration

The logo automatically uses your unified design system:

- **CSS Variables**: All colors come from `--primary`, `--secondary`, `--accent`
- **Tailwind Classes**: Uses your custom color tokens
- **Responsive Design**: Scales properly across all screen sizes
- **Accessibility**: Proper contrast ratios and focus states

## Animation Features

- **Entrance Animations**: Smooth scale and fade-in effects
- **Hover Effects**: Interactive feedback with scale and rotation
- **Glow Effects**: Multi-layered cyberpunk-style glowing rings
- **Orbiting Particles**: Subtle animated elements around the logo
- **Performance**: Optimized animations using Framer Motion

## File Structure

```
src/components/branding/
├── Logo.tsx          # Main logo component
├── LogoDemo.tsx      # Interactive demo component
├── index.ts          # Exports
└── README.md         # This documentation
```

## Examples in Use

- **Header**: `<Logo variant="full" size="md" animated={false} />`
- **Sidebar**: `<Logo variant="icon" size="lg" animated={false} />`
- **Footer**: `<Logo variant="text" size="sm" animated={false} />`
- **Landing Page**: `<Logo variant="hero" size="2xl" animated={true} />`
- **Favicon**: `<Logo variant="icon" size="sm" animated={false} />`

## Customization

The logo is designed to be flexible while maintaining brand consistency:

- **Colors**: Automatically uses design system colors
- **Sizes**: Responsive scaling with consistent proportions
- **Animations**: Can be disabled for performance-critical areas
- **Styling**: Accepts custom className for additional CSS

## Performance Notes

- Animations are disabled by default in production builds
- Uses CSS transforms for smooth 60fps animations
- Lazy-loaded with React.lazy for optimal bundle size
- Optimized re-renders with proper React patterns 