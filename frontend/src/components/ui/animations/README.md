# Animation System Documentation

This document describes the comprehensive animation system built with framer-motion for the MailerSuite frontend.

## Overview

The animation system provides subtle, performant animations that enhance user experience without being distracting. All animations are kept under 0.3 seconds for a snappy feel.

## Core Principles

- **Performance First**: All animations use hardware acceleration and optimized easing curves
- **Subtle & Professional**: Animations enhance UX without being flashy
- **Consistent Timing**: Standardized durations and delays across components
- **Accessibility**: Respects user preferences for reduced motion

## Animation Variants

### Basic Entrance Animations

- `fadeInUp`: Fade in from below with slight scale
- `fadeInLeft`: Slide in from left with scale
- `fadeInRight`: Slide in from right with scale
- `slideInFromTop`: Drop down from above
- `slideInFromBottom`: Rise up from below

### Modal Animations

- `modalBackdrop`: Fade in/out backdrop
- `modalContent`: Scale and fade modal content

### Stagger Animations

- `staggerContainer`: Container for staggered children
- `staggerItem`: Individual staggered item

## Reusable Components

### FadeInUp
```tsx
import { FadeInUp } from '@/components/ui/animations'

<FadeInUp delay={0.1}>
  <div>Content that fades in from below</div>
</FadeInUp>
```

### PageTransition
```tsx
import { PageTransition } from '@/components/ui/animations'

<PageTransition delay={0.2}>
  <div>Page content with entrance animation</div>
</PageTransition>
```

### AnimatedCard
```tsx
import { AnimatedCard } from '@/components/ui/AnimatedCard'

<AnimatedCard 
  delay={0.1} 
  hoverEffect="scale"
  clickable
  onClick={() => console.log('clicked')}
>
  <div>Card content with hover animations</div>
</AnimatedCard>
```

### AnimatedModal
```tsx
import { AnimatedModal } from '@/components/ui/AnimatedModal'

<AnimatedModal isOpen={isOpen} onClose={onClose}>
  <div>Modal content with smooth animations</div>
</AnimatedModal>
```

## Hover Effects

- `hoverScale`: Subtle scale up on hover
- `hoverLift`: Lift up on hover
- `hoverGlow`: Add glow effect on hover

## Performance Optimizations

1. **Hardware Acceleration**: Uses `transform` and `opacity` properties
2. **Easing Curves**: Custom cubic-bezier curves for smooth motion
3. **Stagger Delays**: Minimal delays (0.1s) between elements
4. **Exit Animations**: Quick exit animations (0.2s) for responsiveness

## Usage Guidelines

### When to Use Animations

- **Page Loads**: Subtle entrance animations for main content
- **Modal Openings**: Smooth scale and fade for modals
- **List Items**: Staggered animations for lists and grids
- **Hover States**: Subtle feedback for interactive elements

### When NOT to Use Animations

- **Frequent Updates**: Avoid animations on rapidly changing content
- **Critical Actions**: Don't delay important user actions
- **Mobile**: Consider reduced motion on mobile devices

## Customization

### Timing
```tsx
// Custom delay and duration
<FadeInUp delay={0.5} className="custom-class">
  Content
</FadeInUp>
```

### Easing
```tsx
// Custom easing curve
const customEasing = [0.25, 0.46, 0.45, 0.94]

<motion.div
  transition={{ duration: 0.3, ease: customEasing }}
>
  Content
</motion.div>
```

## Browser Support

- **Modern Browsers**: Full support with hardware acceleration
- **Older Browsers**: Graceful fallback to CSS transitions
- **Reduced Motion**: Respects `prefers-reduced-motion` media query

## Demo Page

Visit `/animation-demo` to see all animations in action and test different configurations.

## Troubleshooting

### Common Issues

1. **Animation not working**: Check if framer-motion is properly imported
2. **Performance issues**: Ensure animations use transform/opacity properties
3. **Layout shifts**: Use `layout` prop for dynamic content

### Debug Mode

Enable debug mode by setting `debug` prop on animation components:
```tsx
<FadeInUp debug>
  Content
</FadeInUp>
```

## Best Practices

1. **Keep it subtle**: Animations should enhance, not distract
2. **Consistent timing**: Use standard delays (0.1s, 0.2s, 0.3s)
3. **Performance first**: Prioritize smooth performance over complex animations
4. **Accessibility**: Always consider users with motion sensitivity
5. **Mobile optimization**: Test animations on mobile devices

## Future Enhancements

- [ ] Gesture-based animations
- [ ] Spring physics for natural motion
- [ ] Advanced stagger patterns
- [ ] Animation presets for common patterns
- [ ] Performance monitoring tools
