# Design Rules

These rules define the visual and interaction system for the MailerSuite frontend.

## Principles

- Consistency over customization
- Accessibility by default (WCAG AA)
- Performance-first (minimal layout thrash, GPU-friendly)

## Typography

- Font scale: 12, 14, 16, 18, 20, 24, 32
- Weights: 400, 500, 600
- Use Tailwind utilities and tokens: `text-foreground`, `muted-foreground`

## Spacing & Layout

- 8px baseline grid (2, 4, 8, 12, 16, 24, 32, 48)
- Container paddings: 16/24
- Card paddings: 16
- Border radius: md default (6px), lg for large surfaces (8–10px)

## Color System

- Tokens (Tailwind CSS variables):
  - Primary: electric blue
  - Secondary: cyan
  - Accent: purple
  - Success/Warning/Destructive per tokens
- Always prefer semantic tokens (`bg-background`, `text-foreground`, `border-border`)

## Components

- Use shadcn/ui patterns and Radix primitives
- Variants via Tailwind + class variance
- Buttons: default, outline, ghost, destructive, ai-gradient
- Cards: standard, glass
- Inputs: strong focus ring, clear error states

## Interactions & Motion

- Hover/focus states must be visible
- Motion subtle by default; respect `prefers-reduced-motion`
- Avoid heavy box-shadows; prefer glow tokens

## Accessibility

- Color contrast ≥ 4.5:1 for text
- Keyboard accessible (tab order, focus-visible)
- ARIA as needed; semantic HTML first
- Form errors must be announced and visible

## Performance

- Avoid layout shift (set explicit sizes)
- Lazy-load heavy routes/assets
- Memoize expensive components; avoid unnecessary re-renders
- Prefer CSS transforms over properties that trigger layout

## Do & Don’t

- Do use `cn()` helper for conditional classes
- Don’t add new global CSS files; extend tokens/utilities instead
- Do keep components small and composable
- Don’t inline large styles or compute styles in render
