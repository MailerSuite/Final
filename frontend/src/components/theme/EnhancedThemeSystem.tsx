/**
 * 🎨 Enhanced SGPT Theme System
 * Default: Dark/Grey/Red with optional color switching
 * Maintains shadcn-ui kit consistency with expandable themes
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ==================== THEME TYPES ====================

export type ThemeColor = 'blue' | 'purple' | 'slate';
export type ThemeMode = 'dark' | 'light';

export interface ThemeConfig {
  color: ThemeColor;
  mode: ThemeMode;
  animated: boolean;
  compact: boolean;
}

export interface ThemeContextType {
  theme: ThemeConfig;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAnimated: (animated: boolean) => void;
  setCompact: (compact: boolean) => void;
  resetToDefault: () => void;
  isDefault: boolean;
}

// ==================== DEFAULT THEME ====================

const DEFAULT_THEME: ThemeConfig = {
  color: 'blue',
  mode: 'dark',
  animated: true,
  compact: false,
};

// ==================== THEME DEFINITIONS ====================

export const THEME_COLORS: Record<ThemeColor, {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  cssVars: Record<string, string>;
}> = {
  blue: {
    name: 'Ocean Blue',
    description: 'Professional blue theme',
    primary: '#2563EB',
    secondary: '#DBEAFE',
    accent: '#1D4ED8',
    gradient: 'from-blue-500 to-blue-700',
    cssVars: {
      '--theme-primary': '221 83% 53%',
      '--theme-primary-foreground': '0 0% 98%',
      '--theme-secondary': '221 83% 53%',
      '--theme-secondary-foreground': '0 0% 9%',
      '--theme-accent': '221 83% 53%',
      '--theme-accent-foreground': '0 0% 98%',
      '--theme-destructive': '0 84% 60%',
      '--theme-destructive-foreground': '0 0% 98%',
      '--theme-ring': '221 83% 53%',
    },
  },
  purple: {
    name: 'Royal Purple',
    description: 'Elegant purple theme',
    primary: '#7C3AED',
    secondary: '#EDE9FE',
    accent: '#6D28D9',
    gradient: 'from-purple-500 to-purple-700',
    cssVars: {
      '--theme-primary': '262 83% 58%',
      '--theme-primary-foreground': '0 0% 98%',
      '--theme-secondary': '262 83% 58%',
      '--theme-secondary-foreground': '0 0% 9%',
      '--theme-accent': '262 83% 58%',
      '--theme-accent-foreground': '0 0% 98%',
      '--theme-destructive': '0 84% 60%',
      '--theme-destructive-foreground': '0 0% 98%',
      '--theme-ring': '262 83% 58%',
    },
  },
  slate: {
    name: 'Steel Slate',
    description: 'Modern slate theme',
    primary: '#475569',
    secondary: '#F1F5F9',
    accent: '#334155',
    gradient: 'from-slate-500 to-slate-700',
    cssVars: {
      '--theme-primary': '215 25% 27%',
      '--theme-primary-foreground': '0 0% 98%',
      '--theme-secondary': '215 25% 27%',
      '--theme-secondary-foreground': '0 0% 9%',
      '--theme-accent': '215 25% 27%',
      '--theme-accent-foreground': '0 0% 98%',
      '--theme-destructive': '0 84% 60%',
      '--theme-destructive-foreground': '0 0% 98%',
      '--theme-ring': '215 25% 27%',
    },
  },
};

// ==================== THEME CONTEXT ====================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ==================== THEME PROVIDER ====================

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Partial<ThemeConfig>;
  storageKey?: string;
  enablePersistence?: boolean;
}

export const EnhancedThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = {},
  storageKey = 'sgpt-theme',
  enablePersistence = true,
}) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_THEME, ...defaultTheme, ...parsed };
        }
      } catch (error) {
        console.warn('Failed to load theme from storage:', error);
      }
    }
    return { ...DEFAULT_THEME, ...defaultTheme };
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(theme));
      } catch (error) {
        console.warn('Failed to save theme to storage:', error);
      }
    }
  }, [theme, storageKey, enablePersistence]);

  // Apply CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const themeConfig = THEME_COLORS[theme.color];

    // Map brand to shadcn HSL variables (no class overrides)
    const hsl = (hex: string) => {
      const m = hex.replace('#', '');
      const r = parseInt(m.substring(0, 2), 16) / 255;
      const g = parseInt(m.substring(2, 4), 16) / 255;
      const b = parseInt(m.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    }

    // Primary brand only; other tokens remain from globals.css
    root.style.setProperty('--primary', hsl(themeConfig.primary));
    root.style.setProperty('--primary-foreground', '0 0% 98%');
    root.style.setProperty('--ring', hsl(themeConfig.primary));

    // Apply mode class and persist
    root.classList.toggle('dark', theme.mode === 'dark');
    try { localStorage.setItem('theme-mode', theme.mode) } catch { }
  }, [theme]);

  const setThemeColor = (color: ThemeColor) => {
    setTheme(prev => ({ ...prev, color }));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const toggleMode = () => {
    setTheme(prev => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' }));
  };

  const setAnimated = (animated: boolean) => {
    setTheme(prev => ({ ...prev, animated }));
  };

  const setCompact = (compact: boolean) => {
    setTheme(prev => ({ ...prev, compact }));
  };

  const resetToDefault = () => {
    setTheme({ ...DEFAULT_THEME, ...defaultTheme });
  };

  const isDefault = JSON.stringify(theme) === JSON.stringify({ ...DEFAULT_THEME, ...defaultTheme });

  const contextValue: ThemeContextType = {
    theme,
    setThemeColor,
    setThemeMode,
    toggleMode,
    setAnimated,
    setCompact,
    resetToDefault,
    isDefault,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ==================== THEME SELECTOR COMPONENT ====================

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Sun,
  Moon,
  Zap,
  RotateCcw,
  Check,
  Sparkles,
  Monitor,
  Smartphone,
  Settings
} from 'lucide-react';

interface ThemeSelectorProps {
  className?: string;
  showAdvanced?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className,
  showAdvanced = true
}) => {
  const {
    theme,
    setThemeColor,
    setThemeMode,
    toggleMode,
    setAnimated,
    setCompact,
    resetToDefault,
    isDefault,
  } = useTheme();

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Customization
        </CardTitle>
        <CardDescription>
          Customize your SGPT experience. Default is dark/grey/red theme.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Color Theme</Label>
            {!isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefault}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset to Default
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(THEME_COLORS).map(([colorKey, config]) => {
              const isSelected = theme.color === colorKey;
              const isDefault = colorKey === 'red';

              return (
                <motion.div
                  key={colorKey}
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isSelected ? "secondary" : "outline"}
                    className={cn(
                      "w-full h-auto p-3 flex flex-col gap-2 relative overflow-hidden",
                      isSelected && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => setThemeColor(colorKey as ThemeColor)}
                  >
                    {/* Color Preview */}
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: config.primary }}
                    />

                    {/* Theme Name */}
                    <div className="text-center">
                      <div className="text-xs font-medium">{config.name}</div>
                      {isDefault && (
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          Default
                        </Badge>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Appearance Mode</Label>
            <p className="text-xs text-muted-foreground">
              Choose between light and dark mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            <Switch
              checked={theme.mode === 'dark'}
              onCheckedChange={(checked) => setThemeMode(checked ? 'dark' : 'light')}
            />
            <Moon className="w-4 h-4" />
          </div>
        </div>

        {showAdvanced && (
          <>
            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Advanced Options</Label>

              <div className="space-y-3">
                {/* Animations Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Enhanced Animations</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable smooth transitions and micro-interactions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <Switch
                      checked={theme.animated}
                      onCheckedChange={setAnimated}
                    />
                  </div>
                </div>

                {/* Compact Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Compact Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Reduce spacing for better information density
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <Switch
                      checked={theme.compact}
                      onCheckedChange={setCompact}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Current Theme Info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Current Theme:</span>
            <Badge variant="outline">
              {THEME_COLORS[theme.color].name} • {theme.mode} mode
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== THEME UTILITIES ====================

export const getThemeClass = (color: ThemeColor, mode: ThemeMode = 'dark') => {
  return cn(mode, `theme-${color}`);
};

export const getThemeColors = (color: ThemeColor) => {
  return THEME_COLORS[color];
};

export const createThemeVariants = (color: ThemeColor) => {
  const colors = THEME_COLORS[color];
  return {
    primary: `bg-[${colors.primary}] text-white`,
    secondary: `bg-[${colors.secondary}] text-foreground`,
    accent: `bg-[${colors.accent}] text-white`,
    gradient: `bg-gradient-to-r ${colors.gradient}`,
  };
};

// Export theme provider as default
export default EnhancedThemeProvider;