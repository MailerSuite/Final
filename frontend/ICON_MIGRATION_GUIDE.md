# Icon Migration Guide

## Overview
This guide helps you migrate from the old icon system to the new unified icon system that provides:
- Consistent sizing with predefined classes
- Theme adaptation using `currentColor`
- Standardized API across all icon components
- Better accessibility and maintainability

## New Icon System Features

### Icon Sizes
- `xs`: 12x12px (w-3 h-3)
- `sm`: 16x16px (w-4 h-4) - **Default**
- `base`: 20x20px (w-5 h-5)
- `lg`: 24x24px (w-6 h-6)
- `xl`: 32x32px (w-8 h-8)
- `2xl`: 40x40px (w-10 h-10)
- `3xl`: 48x48px (w-12 h-12)

### Color System
- `text-current`: Inherits parent text color (theme-aware)
- `text-primary`: Primary brand color
- `text-secondary`: Secondary brand color
- `text-success`: Success state color
- `text-warning`: Warning state color
- `text-destructive`: Error/destructive color
- `text-muted-foreground`: Muted text color

## Migration Examples

### Before (Old System)
```tsx
// Hardcoded sizes
<Info className="w-4 h-4 text-blue-400" />
<Server className="w-5 h-5" />
<Ban className="w-4 h-4 text-orange-500" />

// Mixed icon libraries
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Info } from 'lucide-react'
```

### After (New System)
```tsx
// Consistent sizing
<InfoIcon size="sm" />
<InfoIcon size="lg" />
<InfoIcon size="xl" />

// Theme-aware colors
<InfoIcon severity="info" /> // Uses text-info
<WarningIcon /> // Uses text-warning
<BlacklistIcon /> // Uses text-destructive

// Unified API
import { InfoIcon, WarningIcon, BlacklistIcon } from '@/components/Icon'
```

## Component Updates

### 1. Replace Hardcoded Sizes
```tsx
// Old
<ChevronLeftIcon className="w-4 h-4" />

// New
<Icon name="ChevronLeft" size="sm" ariaLabel="Collapse sidebar" />
```

### 2. Use Semantic Colors
```tsx
// Old
<CheckCircle className="w-4 h-4 text-green-500" />

// New
<Icon name="CheckCircle" size="sm" className="text-success" ariaLabel="Success" />
```

### 3. Migrate from Heroicons
```tsx
// Old
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
<ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />

// New
import { Icon } from '@/components/ui/icon'
<Icon name="AlertTriangle" size="sm" className="text-warning" ariaLabel="Warning" />
```

## Best Practices

### 1. Always Use Size Props
```tsx
// Good
<InfoIcon size="lg" />
<Icon name="Mail" size="base" />

// Avoid
<InfoIcon className="w-6 h-6" />
```

### 2. Use Semantic Colors
```tsx
// Good
<WarningIcon /> // Automatically uses text-warning
<InfoIcon severity="error" /> // Uses text-destructive

// Avoid
<WarningIcon className="text-yellow-400" />
```

### 3. Provide Accessible Labels
```tsx
// Good
<Icon name="Mail" ariaLabel="Email" />
<InfoIcon aria-label="Information" />

// Avoid
<Icon name="Mail" />
```

### 4. Use CurrentColor for Theme Adaptation
```tsx
// Good - automatically adapts to theme
<Icon name="Settings" className="text-current" />

// Avoid - hardcoded colors
<Icon name="Settings" className="text-gray-600" />
```

## Available Icons

### Custom Icon Components
- `BlacklistIcon` - Ban icon with destructive color
- `DomainIcon` - Globe/CheckCircle/ShieldAlert variants
- `InboxIcon` - Inbox icon
- `InfoIcon` - Info icon with severity variants
- `ProxyIcon` - Network icon with status variants
- `SmtpIcon` - Server icon
- `TemplateIcon` - LayoutTemplate icon
- `WarningIcon` - AlertTriangle icon

### Lucide React Icons
All icons from `lucide-react` are available via the `Icon` component:
```tsx
import { Icon } from '@/components/ui/icon'

<Icon name="Mail" size="lg" />
<Icon name="Settings" size="base" />
<Icon name="User" size="sm" />
```

## Migration Checklist

- [ ] Replace hardcoded `w-4 h-4` with `size="sm"`
- [ ] Replace hardcoded `w-5 h-5` with `size="base"`
- [ ] Replace hardcoded `w-6 h-6` with `size="lg"`
- [ ] Replace hardcoded colors with semantic color classes
- [ ] Add `ariaLabel` or `aria-label` to all icons
- [ ] Migrate from Heroicons to Lucide React equivalents
- [ ] Test theme switching to ensure icons adapt properly
- [ ] Verify icon sizes are consistent across components

## Benefits

1. **Consistency**: All icons follow the same sizing and color system
2. **Theme Adaptation**: Icons automatically adapt to light/dark themes
3. **Maintainability**: Centralized icon management and updates
4. **Accessibility**: Proper ARIA labels and semantic colors
5. **Performance**: Reduced bundle size by standardizing on one icon library
6. **Developer Experience**: Intuitive API and better TypeScript support
