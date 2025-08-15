/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Wizard Tech Theme Colors
        wizard: {
          'primary-bg': '#0A0F1C',        // Very dark blue base
          'secondary-bg': '#111827',      // Slightly lighter deep blue
          'primary-accent': '#3AAFFF',    // Vibrant electric blue
          'secondary-accent': '#1E40AF',  // Rich professional blue
          'text': '#E6E6E6',              // Light grey for body text
          'heading': '#FFFFFF',           // Bright white for headings
          'border': 'rgba(30, 64, 175, 0.3)', // Translucent blue
          'glow-blue': '#3AAFFF',         // Neon blue for glows
          'glow-secondary': '#1E40AF',    // Secondary blue for glows
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'wizard-gradient': 'linear-gradient(135deg, #3AAFFF 0%, #1E40AF 100%)',
        'wizard-gradient-subtle': 'linear-gradient(135deg, rgba(10, 15, 28, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
        'wizard-radial': 'radial-gradient(circle at center, #111827 0%, #0A0F1C 100%)',
        'wizard-swirl': 'conic-gradient(from 0deg at 50% 50%, #0A0F1C 0deg, #111827 120deg, #1E40AF 240deg, #0A0F1C 360deg)',
      },
      boxShadow: {
        'wizard-glow': '0 0 20px rgba(58, 175, 255, 0.3), 0 0 40px rgba(58, 175, 255, 0.1)',
        'wizard-glow-sm': '0 0 10px rgba(58, 175, 255, 0.3), 0 0 20px rgba(58, 175, 255, 0.1)',
        'wizard-glow-lg': '0 0 30px rgba(58, 175, 255, 0.4), 0 0 60px rgba(58, 175, 255, 0.2)',
        'wizard-glow-secondary': '0 0 20px rgba(30, 64, 175, 0.3), 0 0 40px rgba(30, 64, 175, 0.1)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Wizard tech animations
        "sparkle": {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        "float": {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        "pulse-glow": {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        "swirl": {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        "shimmer": {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "swirl": "swirl 20s linear infinite",
        "shimmer": "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}