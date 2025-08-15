/**
 * Theme Store for Landing Page
 * Manages dark/light mode and color schemes using shadcn-ui
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  language: string;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setLanguage: (language: string) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      language: 'en',

      setMode: (mode) => {
        set({ mode });
        // Update class list properly
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(mode);
        document.documentElement.setAttribute('data-theme', mode);

        // Sync with localStorage for all theme providers
        localStorage.setItem('mailersuite-theme', mode);
        localStorage.setItem('sgpt-ui-theme', mode);
        localStorage.setItem('vite-ui-theme', mode);
      },

      setLanguage: (language) => {
        set({ language });
        document.documentElement.setAttribute('lang', language);
      },

      toggleMode: () => {
        const { mode } = get();
        const newMode = mode === 'dark' ? 'light' : 'dark';
        get().setMode(newMode);
      }
    }),
    {
      name: 'mailersuite-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on hydration
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(state.mode);
          document.documentElement.setAttribute('data-theme', state.mode);
          document.documentElement.setAttribute('lang', state.language);

          // Sync with all theme providers
          localStorage.setItem('mailersuite-theme', state.mode);
          localStorage.setItem('sgpt-ui-theme', state.mode);
          localStorage.setItem('vite-ui-theme', state.mode);
        } else {
          // Initialize default theme if no stored state
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.setAttribute('lang', 'en');
          localStorage.setItem('mailersuite-theme', 'dark');
          localStorage.setItem('sgpt-ui-theme', 'dark');
          localStorage.setItem('vite-ui-theme', 'dark');
        }
      }
    }
  )
);

// Initialize theme immediately to prevent flash
const initializeTheme = () => {
  // Check if theme is already set
  const storedTheme = localStorage.getItem('mailersuite-theme') || 
                      localStorage.getItem('sgpt-theme') || 
                      localStorage.getItem('sgpt-ui-theme');

  if (!storedTheme) {
    // Set default dark theme
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('lang', 'en');
    localStorage.setItem('mailersuite-theme', 'dark');
    localStorage.setItem('sgpt-ui-theme', 'dark');
    localStorage.setItem('vite-ui-theme', 'dark');
  }
};

// Initialize theme on module load
if (typeof window !== 'undefined') {
  initializeTheme();
}

// Theme configuration unified with CSS variables
export const themeConfig = {
  colors: {
    dark: {
      primary: 'hsl(213, 94%, 51%)', // Professional blue
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(270, 60%, 55%)', // Subtle purple
      accent: 'hsl(213, 80%, 45%)', // Deep blue accent
      background: 'hsl(220, 30%, 8%)', // Dark blue-grey
      foreground: 'hsl(0, 0%, 88%)',
    },
    light: {
      primary: 'hsl(213, 90%, 45%)', // Professional blue
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(270, 55%, 50%)', // Purple
      accent: 'hsl(213, 75%, 50%)', // Blue accent
      background: 'hsl(0, 0%, 98%)',
      foreground: 'hsl(220, 30%, 12%)',
    }
  }
};