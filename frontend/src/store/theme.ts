/**
 * Theme Store for Landing Page
 * Manages dark/light mode and color schemes using shadcn-ui
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorScheme = 'blue' | 'black' | 'purple';
export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  language: string;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setLanguage: (language: string) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      colorScheme: 'blue',
      language: 'en',

      setMode: (mode) => {
        set({ mode });
        // Update class list properly
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(mode);
        document.documentElement.setAttribute('data-theme', mode);

        // Also sync with localStorage for the React ThemeProvider
        localStorage.setItem('sgpt-ui-theme', mode);
      },

      setColorScheme: (colorScheme) => {
        set({ colorScheme });
        // Remove existing color scheme classes
        const schemes: ColorScheme[] = ['blue', 'black', 'purple'];
        schemes.forEach(scheme => {
          document.documentElement.classList.remove(`theme-${scheme}`);
        });
        // Add new color scheme class
        document.documentElement.classList.add(`theme-${colorScheme}`);
        document.documentElement.setAttribute('data-color-scheme', colorScheme);
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
      name: 'sgpt-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on hydration
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(state.mode);
          document.documentElement.setAttribute('data-theme', state.mode);
          document.documentElement.classList.add(`theme-${state.colorScheme}`);
          document.documentElement.setAttribute('data-color-scheme', state.colorScheme);
          document.documentElement.setAttribute('lang', state.language);

          // Sync with React ThemeProvider
          localStorage.setItem('sgpt-ui-theme', state.mode);
        } else {
          // Initialize default theme if no stored state
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.classList.add('theme-blue');
          document.documentElement.setAttribute('data-color-scheme', 'blue');
          document.documentElement.setAttribute('lang', 'en');
          localStorage.setItem('sgpt-ui-theme', 'dark');
        }
      }
    }
  )
);

// Initialize theme immediately to prevent flash
const initializeTheme = () => {
  // Check if theme is already set
  const storedTheme = localStorage.getItem('sgpt-theme');
  const reactTheme = localStorage.getItem('sgpt-ui-theme');

  if (!storedTheme && !reactTheme) {
    // Set default dark theme
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('theme-blue');
    document.documentElement.setAttribute('data-color-scheme', 'blue');
    document.documentElement.setAttribute('lang', 'en');
    localStorage.setItem('sgpt-ui-theme', 'dark');
  }
};

// Initialize theme on module load
if (typeof window !== 'undefined') {
  initializeTheme();
}

// Theme configuration for shadcn-ui
export const themeConfig = {
  colors: {
    blue: {
      primary: 'hsl(217, 91%, 60%)',
      primaryForeground: 'hsl(0, 0%, 98%)',
      secondary: 'hsl(217, 91%, 60%)',
      accent: 'hsl(217, 100%, 70%)',
    },
    black: {
      primary: 'hsl(0, 0%, 9%)',
      primaryForeground: 'hsl(0, 0%, 98%)',
      secondary: 'hsl(0, 0%, 14%)',
      accent: 'hsl(0, 0%, 24%)',
    },
    purple: {
      primary: 'hsl(262, 83%, 58%)',
      primaryForeground: 'hsl(0, 0%, 98%)',
      secondary: 'hsl(262, 83%, 58%)',
      accent: 'hsl(262, 83%, 68%)',
    }
  }
};