/**
 * SGPT Theme Validator
 * Helps identify components not following the SGPT dark/red theme
 */

// Official SGPT Colors
export const SGPT_COLORS = {
  // Primary reds
  primary: '#D73333',
  accent: '#ff384b',
  hover: '#B82C2C',
  
  // Dark backgrounds
  background: '#141414',
  card: '#1A1A1A',
  surface: '#262626',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#EAEAEA',
  textMuted: '#AAB3C2',
  
  // Borders
  border: '#1F2937',
  borderLight: '#374151',
} as const;

// Colors that should NOT be used (old blue theme)
export const DEPRECATED_COLORS = [
  '#2979FF',  // Old electric blue
  '#00BFFF',  // Old neon blue
  '#1DA1F2',  // Twitter blue
  '#1E5FCC',  // Old hover blue
  '#646cff',  // Old button border
  '#0A0F1C',  // Old navy background
  '#0F1420',  // Old navy surface
  '#141B2B',  // Old navy tertiary
] as const;

/**
 * Check if a color value follows SGPT theme
 */
export function isValidSGPTColor(color: string): boolean {
  const normalizedColor = color.toLowerCase().trim();
  
  // Check if it's a deprecated blue color
  if (DEPRECATED_COLORS.some(depColor => 
    normalizedColor.includes(depColor.toLowerCase())
  )) {
    return false;
  }
  
  // Check if it's using proper SGPT colors
  if (Object.values(SGPT_COLORS).some(sgptColor => 
    normalizedColor.includes(sgptColor.toLowerCase())
  )) {
    return true;
  }
  
  // Allow standard neutral colors
  const allowedNeutrals = [
    '#ffffff', '#000000', '#gray', '#grey', 
    'transparent', 'inherit', 'currentcolor'
  ];
  
  return allowedNeutrals.some(neutral => 
    normalizedColor.includes(neutral)
  );
}

/**
 * Get SGPT-compliant replacement for deprecated color
 */
export function getSGPTReplacement(deprecatedColor: string): string {
  const colorMap: Record<string, string> = {
    '#2979FF': SGPT_COLORS.primary,     // Electric blue → SGPT red
    '#00BFFF': SGPT_COLORS.accent,      // Neon blue → SGPT bright red
    '#1DA1F2': SGPT_COLORS.primary,     // Twitter blue → SGPT red
    '#1E5FCC': SGPT_COLORS.hover,       // Blue hover → Red hover
    '#646cff': SGPT_COLORS.primary,     // Button border → SGPT red
    '#0A0F1C': SGPT_COLORS.background,  // Navy bg → Dark grey
    '#0F1420': SGPT_COLORS.card,        // Navy surface → Dark card
    '#141B2B': SGPT_COLORS.surface,     // Navy tertiary → Surface
  };
  
  return colorMap[deprecatedColor] || deprecatedColor;
}

/**
 * Development helper to log theme violations
 */
export function validateElementTheme(element: Element): void {
  if (!import.meta.env.DEV) return;
  
  const computedStyle = window.getComputedStyle(element);
  const violations: string[] = [];
  
  // Check key CSS properties for theme violations
  const propertiesToCheck = [
    'color', 'backgroundColor', 'borderColor', 
    'boxShadow', 'outline', 'fill', 'stroke'
  ];
  
  propertiesToCheck.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && !isValidSGPTColor(value)) {
      violations.push(`${prop}: ${value}`);
    }
  });
  
  if (violations.length > 0) {
    console.warn('🎨 Theme violation detected:', element, violations);
  }
}

/**
 * Debug function to scan page for theme violations
 */
export function scanPageForThemeViolations(): void {
  if (!import.meta.env.DEV) return;
  
  console.group('🔍 SGPT Theme Validation');
  
  const allElements = document.querySelectorAll('*');
  let violationCount = 0;
  
  allElements.forEach(element => {
    try {
      const computedStyle = window.getComputedStyle(element);
      const bgColor = computedStyle.backgroundColor;
      const textColor = computedStyle.color;
      const borderColor = computedStyle.borderColor;
      
      if (
        (bgColor && !isValidSGPTColor(bgColor)) ||
        (textColor && !isValidSGPTColor(textColor)) ||
        (borderColor && !isValidSGPTColor(borderColor))
      ) {
        violationCount++;
        console.warn('Theme violation:', element.tagName, {
          background: bgColor,
          color: textColor,
          border: borderColor
        });
      }
    } catch (e) {
      // Ignore elements that can't be styled
    }
  });
  
  if (violationCount === 0) {
    console.log('✅ No theme violations found!');
  } else {
    console.warn(`⚠️ Found ${violationCount} potential theme violations`);
  }
  
  console.groupEnd();
}

// Expose debug tools in development
if (import.meta.env.DEV) {
  (window as any).sgptTheme = {
    validate: scanPageForThemeViolations,
    colors: SGPT_COLORS,
    isValid: isValidSGPTColor,
    replace: getSGPTReplacement
  };
} 