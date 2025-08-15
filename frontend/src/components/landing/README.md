# 🚀 Landing UI Kit - Marketing & Public Pages

**Professional landing page components built with shadcn/ui, TypeScript, and Framer Motion**

---

## 🌟 **Overview**

The Landing UI Kit provides a comprehensive set of components specifically designed for public-facing marketing interfaces in the SGPT platform. This includes hero sections, pricing tables, feature showcases, testimonials, and call-to-action components optimized for conversion.

### ✨ **Key Features**

- ✅ **Marketing-focused Design** with SGPT brand colors (red, black, white)
- ✅ **Conversion Optimized** components for lead generation
- ✅ **Smooth Animations** with Framer Motion for engagement
- ✅ **Responsive Design** optimized for all devices
- ✅ **SEO Friendly** with proper semantic HTML
- ✅ **Performance First** with lazy loading and optimization
- ✅ **A/B Testing Ready** with variant support

---

## 📦 **Installation & Setup**

```bash
# Install dependencies (if not already installed)
npm install framer-motion lucide-react
npm install @radix-ui/react-* # shadcn/ui components
```

### Import Components

```typescript
// Hero components
import {
  HeroSection,
  HeroTitle,
  HeroSubtitle,
  HeroCTA,
  HeroFeatures
} from '@/components/landing/hero';

// Feature components
import {
  FeatureGrid,
  FeatureCard,
  FeatureHighlight
} from '@/components/landing/features';

// Pricing components
import {
  PricingSection,
  PricingCard,
  PricingTier
} from '@/components/landing/pricing';

// Social proof
import {
  TestimonialGrid,
  TestimonialCard,
  StatsSection
} from '@/components/landing/social-proof';
```

---

## 🧩 **Core Components**

### 1. **Hero Section**
Main landing page hero with title, subtitle, and CTA buttons.

### 2. **Feature Showcase**
Grid-based feature presentations with icons and descriptions.

### 3. **Pricing Tables**
Professional pricing comparison tables with features.

### 4. **Social Proof**
Testimonials, stats, and trust indicators.

### 5. **Call-to-Action**
Conversion-optimized CTA sections throughout the page.

---

## 🎨 **Design Tokens**

### Color Palette
```css
:root {
  --landing-primary: hsl(0 72% 51%);      /* SGPT Red */
  --landing-background: hsl(0 0% 3.9%);   /* Dark Background */
  --landing-foreground: hsl(0 0% 98%);    /* Light Text */
  --landing-accent: hsl(0 0% 14.9%);      /* Card Backgrounds */
  --landing-border: hsl(0 0% 14.9%);      /* Borders */
}
```

### Typography
- **Headings:** Inter/Geist Sans, bold weights
- **Body:** Inter/Geist Sans, regular/medium
- **Code:** Geist Mono

---

## 🔧 **Usage Examples**

### Basic Hero Section
```typescript
<HeroSection>
  <HeroTitle>AI-Powered Email Marketing Platform</HeroTitle>
  <HeroSubtitle>
    Revolutionizing email marketing with AI-driven intelligence
  </HeroSubtitle>
  <HeroCTA 
    primaryText="Start Free Trial"
    secondaryText="View Demo"
    onPrimaryClick={() => navigate('/auth/sign-up')}
    onSecondaryClick={() => openDemo()}
  />
</HeroSection>
```

### Feature Grid
```typescript
<FeatureGrid>
  <FeatureCard
    icon={<Zap />}
    title="Lightning Fast"
    description="Send millions of emails with industry-leading speed"
  />
  <FeatureCard
    icon={<Shield />}
    title="Enterprise Security"
    description="Bank-grade security with end-to-end encryption"
  />
</FeatureGrid>
```

---

## 📱 **Responsive Behavior**

- **Mobile:** Single column, optimized touch targets
- **Tablet:** Two-column grids, adjusted spacing
- **Desktop:** Full multi-column layouts, hover effects

---

## ♿ **Accessibility**

- ARIA labels and roles
- Keyboard navigation support
- Screen reader optimization
- High contrast mode support
- Focus management

---

## 🚀 **Performance**

- Lazy loaded components
- Optimized images with WebP
- Minimal bundle size
- Critical CSS inlined
- Preload key resources

---

This kit inherits the design system foundation while being optimized specifically for marketing and conversion goals.