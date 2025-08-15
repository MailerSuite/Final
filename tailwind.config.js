/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1220',
          800: '#0f172a',
          700: '#11193a',
        },
        neon: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          blue: '#3b82f6',
        },
        // App-style tokens used in index.html
        background: '#0b1220',
        foreground: '#f8fafc',
        card: '#1e293b',
        'card-foreground': '#f1f5f9',
        popover: '#1e293b',
        'popover-foreground': '#f1f5f9',
        primary: '#3b82f6',
        'primary-foreground': '#ffffff',
        secondary: '#475569',
        'secondary-foreground': '#f1f5f9',
        muted: '#475569',
        'muted-foreground': '#94a3b8',
        accent: '#334155',
        'accent-foreground': '#f1f5f9',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: '#334155',
        input: '#374151',
        ring: '#3b82f6',
      },
      boxShadow: {
        neon: '0 0 20px rgba(34,211,238,0.35), 0 0 60px rgba(139,92,246,0.20)',
      },
      backdropBlur: {
        6: '6px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 0.35rem rgba(34,211,238,0.45))' },
          '50%': { filter: 'drop-shadow(0 0 0.7rem rgba(139,92,246,0.55))' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'gradient-y': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'gradient-xy': {
          '0%, 100%': { 'background-position': 'left center' },
          '25%': { 'background-position': 'left top' },
          '50%': { 'background-position': 'right top' },
          '75%': { 'background-position': 'right center' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        aurora: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        holographic: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        orbit: 'orbit 40s linear infinite',
        glow: 'glow 5s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        aurora: 'aurora 6s ease infinite',
        holographic: 'holographic 4s ease infinite',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'radial-neon': 'radial-gradient(ellipse 60% 40% at 20% 10%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(ellipse 40% 30% at 80% 0%, rgba(139,92,246,0.14), transparent 60%)',
      },
    },
  },
  plugins: [],
};

