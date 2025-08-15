// FinalUI2 Design System Configuration
// Professional enterprise-grade theme system with customizable color palettes

export interface ThemeColor {
  name: string;
  value: string;
  rgb: string;
  hsl: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  mode: 'dark' | 'light';
}

// Predefined color palettes inspired by top-tier design systems
export const colorPalettes = {
  // Cyberpunk Neon
  neon: {
    primary: { h: 189, s: 94, l: 53 }, // Cyan
    secondary: { h: 217, s: 91, l: 60 }, // Blue
    accent: { h: 262, s: 83, l: 58 }, // Violet
    success: { h: 160, s: 84, l: 39 }, // Emerald
    warning: { h: 38, s: 92, l: 50 }, // Amber
    danger: { h: 0, s: 84, l: 60 }, // Red
    info: { h: 199, s: 89, l: 48 }, // Sky
  },
  // Professional Dark
  professional: {
    primary: { h: 221, s: 83, l: 53 }, // Indigo
    secondary: { h: 210, s: 16, l: 45 }, // Slate
    accent: { h: 142, s: 71, l: 45 }, // Green
    success: { h: 142, s: 76, l: 36 }, // Green
    warning: { h: 45, s: 93, l: 47 }, // Yellow
    danger: { h: 0, s: 72, l: 51 }, // Red
    info: { h: 207, s: 90, l: 54 }, // Blue
  },
  // Emerald Tech
  emerald: {
    primary: { h: 158, s: 64, l: 52 }, // Emerald
    secondary: { h: 173, s: 80, l: 40 }, // Teal
    accent: { h: 192, s: 91, l: 56 }, // Cyan
    success: { h: 142, s: 76, l: 36 }, // Green
    warning: { h: 25, s: 95, l: 53 }, // Orange
    danger: { h: 346, s: 77, l: 50 }, // Rose
    info: { h: 201, s: 96, l: 32 }, // Blue
  },
  // Midnight Purple
  midnight: {
    primary: { h: 280, s: 68, l: 50 }, // Purple
    secondary: { h: 250, s: 80, l: 60 }, // Violet
    accent: { h: 340, s: 82, l: 52 }, // Pink
    success: { h: 161, s: 79, l: 37 }, // Teal
    warning: { h: 31, s: 97, l: 48 }, // Orange
    danger: { h: 343, s: 80, l: 52 }, // Rose
    info: { h: 234, s: 89, l: 62 }, // Slate Blue
  },
  // Ocean Blue
  ocean: {
    primary: { h: 213, s: 94, l: 51 }, // Ocean Blue
    secondary: { h: 198, s: 93, l: 48 }, // Sky
    accent: { h: 186, s: 92, l: 49 }, // Cyan
    success: { h: 154, s: 75, l: 40 }, // Seafoam
    warning: { h: 37, s: 98, l: 54 }, // Gold
    danger: { h: 355, s: 78, l: 56 }, // Coral
    info: { h: 205, s: 100, l: 40 }, // Azure
  },
  // Sunset Gradient
  sunset: {
    primary: { h: 15, s: 90, l: 54 }, // Vermillion
    secondary: { h: 33, s: 100, l: 50 }, // Orange
    accent: { h: 55, s: 92, l: 55 }, // Yellow
    success: { h: 88, s: 61, l: 44 }, // Lime
    warning: { h: 48, s: 100, l: 50 }, // Amber
    danger: { h: 350, s: 89, l: 60 }, // Pink Red
    info: { h: 250, s: 69, l: 55 }, // Purple
  },
  // Matrix Green
  matrix: {
    primary: { h: 120, s: 100, l: 40 }, // Matrix Green
    secondary: { h: 120, s: 60, l: 30 }, // Dark Green
    accent: { h: 90, s: 100, l: 50 }, // Lime
    success: { h: 120, s: 100, l: 35 }, // Green
    warning: { h: 60, s: 100, l: 50 }, // Yellow
    danger: { h: 0, s: 100, l: 50 }, // Red
    info: { h: 150, s: 100, l: 40 }, // Teal
  },
  // Monochrome Pro
  monochrome: {
    primary: { h: 0, s: 0, l: 95 }, // White
    secondary: { h: 0, s: 0, l: 70 }, // Light Gray
    accent: { h: 0, s: 0, l: 50 }, // Gray
    success: { h: 142, s: 71, l: 45 }, // Green
    warning: { h: 38, s: 92, l: 50 }, // Amber
    danger: { h: 0, s: 84, l: 60 }, // Red
    info: { h: 217, s: 91, l: 60 }, // Blue
  }
};

// Generate HSL color string
export const hslColor = (h: number, s: number, l: number, a?: number) => {
  return a !== undefined ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
};

// Convert HSL to RGB
export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
};

// Theme presets
export const themePresets: ThemePreset[] = [
  {
    id: 'neon-dark',
    name: 'Cyberpunk Neon',
    description: 'Futuristic neon colors with high contrast',
    mode: 'dark',
    colors: {
      primary: hslColor(189, 94, 53),
      secondary: hslColor(217, 91, 60),
      accent: hslColor(262, 83, 58),
      success: hslColor(160, 84, 39),
      warning: hslColor(38, 92, 50),
      danger: hslColor(0, 84, 60),
      info: hslColor(199, 89, 48),
    },
  },
  {
    id: 'professional-dark',
    name: 'Professional Dark',
    description: 'Clean and professional for business',
    mode: 'dark',
    colors: {
      primary: hslColor(221, 83, 53),
      secondary: hslColor(210, 16, 45),
      accent: hslColor(142, 71, 45),
      success: hslColor(142, 76, 36),
      warning: hslColor(45, 93, 47),
      danger: hslColor(0, 72, 51),
      info: hslColor(207, 90, 54),
    },
  },
  {
    id: 'emerald-tech',
    name: 'Emerald Tech',
    description: 'Modern tech with emerald accents',
    mode: 'dark',
    colors: {
      primary: hslColor(158, 64, 52),
      secondary: hslColor(173, 80, 40),
      accent: hslColor(192, 91, 56),
      success: hslColor(142, 76, 36),
      warning: hslColor(25, 95, 53),
      danger: hslColor(346, 77, 50),
      info: hslColor(201, 96, 32),
    },
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    description: 'Deep purple theme for creative work',
    mode: 'dark',
    colors: {
      primary: hslColor(280, 68, 50),
      secondary: hslColor(250, 80, 60),
      accent: hslColor(340, 82, 52),
      success: hslColor(161, 79, 37),
      warning: hslColor(31, 97, 48),
      danger: hslColor(343, 80, 52),
      info: hslColor(234, 89, 62),
    },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Deep ocean inspired colors',
    mode: 'dark',
    colors: {
      primary: hslColor(213, 94, 51),
      secondary: hslColor(198, 93, 48),
      accent: hslColor(186, 92, 49),
      success: hslColor(154, 75, 40),
      warning: hslColor(37, 98, 54),
      danger: hslColor(355, 78, 56),
      info: hslColor(205, 100, 40),
    },
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Vibes',
    description: 'Warm sunset inspired palette',
    mode: 'dark',
    colors: {
      primary: hslColor(15, 90, 54),
      secondary: hslColor(33, 100, 50),
      accent: hslColor(55, 92, 55),
      success: hslColor(88, 61, 44),
      warning: hslColor(48, 100, 50),
      danger: hslColor(350, 89, 60),
      info: hslColor(250, 69, 55),
    },
  },
  {
    id: 'matrix-green',
    name: 'Matrix',
    description: 'Classic matrix green theme',
    mode: 'dark',
    colors: {
      primary: hslColor(120, 100, 40),
      secondary: hslColor(120, 60, 30),
      accent: hslColor(90, 100, 50),
      success: hslColor(120, 100, 35),
      warning: hslColor(60, 100, 50),
      danger: hslColor(0, 100, 50),
      info: hslColor(150, 100, 40),
    },
  },
  {
    id: 'monochrome-pro',
    name: 'Monochrome Pro',
    description: 'Minimalist black and white',
    mode: 'dark',
    colors: {
      primary: hslColor(0, 0, 95),
      secondary: hslColor(0, 0, 70),
      accent: hslColor(0, 0, 50),
      success: hslColor(142, 71, 45),
      warning: hslColor(38, 92, 50),
      danger: hslColor(0, 84, 60),
      info: hslColor(217, 91, 60),
    },
  },
];

export const themeVariants = [
  {
    id: 'blue',
    name: 'Professional Blue',
    description: 'Modern blue theme for professional applications',
    colors: {
      primary: '#3AAFFF',
      secondary: '#1E40AF',
      background: '#0A0F1C',
      surface: '#111827',
      accent: '#60A5FA'
    }
  },
  {
    id: 'blue-dark',
    name: 'Deep Blue',
    description: 'Dark blue theme for focused work',
    colors: {
      primary: '#3AAFFF',
      secondary: '#1E40AF',
      background: '#0A0F1C',
      surface: '#111827',
      accent: '#60A5FA'
    }
  },
  {
    id: 'blue-light',
    name: 'Light Blue',
    description: 'Light blue theme for daytime use',
    colors: {
      primary: '#3AAFFF',
      secondary: '#1E40AF',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      accent: '#60A5FA'
    }
  },
  {
    id: 'black',
    name: 'Classic Black',
    description: 'Minimalist black theme',
    colors: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
      background: '#000000',
      surface: '#111111',
      accent: '#6B7280'
    }
  }
];

// Design tokens for consistent spacing, typography, etc.
export const designTokens = {
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.625rem',   // 10px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    full: '9999px',
  },
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 30px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(34, 211, 238, 0.5)',
    neon: '0 0 30px rgba(34, 211, 238, 0.8)',
  },
  blur: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
  },
};

// Export utility to apply theme
export const applyTheme = (preset: ThemePreset) => {
  const root = document.documentElement;

  // Apply color variables
  Object.entries(preset.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  // Apply mode
  root.setAttribute('data-theme-mode', preset.mode);
  root.setAttribute('data-theme-id', preset.id);

  // Save to localStorage
  localStorage.setItem('finalui-theme', preset.id);
};

// Get current theme from localStorage
export const getCurrentTheme = (): ThemePreset => {
  const savedThemeId = localStorage.getItem('finalui-theme');
  // Default to Midnight Purple if nothing saved
  return themePresets.find(t => t.id === savedThemeId)
    || themePresets.find(t => t.id === 'midnight-purple')
    || themePresets[0];
};