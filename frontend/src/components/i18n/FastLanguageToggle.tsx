import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check, Languages } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SUPPORTED_LOCALES } from '@/types/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FastLanguageToggleProps {
  /**
   * Size variant of the toggle
   */
  variant?: 'compact' | 'full' | 'icon-only';
  /**
   * Whether this is for mobile view
   */
  isMobile?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Whether to show flags prominently
   */
  showFlags?: boolean;
  /**
   * Callback when language changes
   */
  onLanguageChange?: (locale: SupportedLocale) => void;
}

/**
 * Blazing fast language toggle component optimized for performance
 * Features:
 * - Instant language switching with caching
 * - Smooth animations with framer-motion
 * - Responsive design for mobile/desktop
 * - Accessible keyboard navigation
 * - Prominent flag display
 */
export const FastLanguageToggle: React.FC<FastLanguageToggleProps> = ({
  variant = 'full',
  isMobile = false,
  className,
  showFlags = true,
  onLanguageChange,
}) => {
  const { locale, setLocale, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Memoize current locale info for performance
  const currentLocale = useMemo(
    () => SUPPORTED_LOCALES.find(l => l.code === locale),
    [locale]
  );

  // Optimized language change handler with caching
  const handleLanguageChange = useCallback(async (newLocale: SupportedLocale) => {
    if (newLocale === locale) return; // Skip if same language
    
    try {
      setIsOpen(false); // Close immediately for better UX
      await setLocale(newLocale);
      onLanguageChange?.(newLocale);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [locale, setLocale, onLanguageChange]);

  // Optimized keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, localeCode: SupportedLocale) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageChange(localeCode);
    }
  }, [handleLanguageChange]);

  // Render content based on variant
  const renderTriggerContent = () => {
    if (variant === 'icon-only') {
      return (
        <div className="flex items-center gap-1">
          <Globe className="h-4 w-4" />
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2">
          {showFlags && <span className="text-lg leading-none">{currentLocale?.flag}</span>}
          <span className="font-medium text-sm">{currentLocale?.code.toUpperCase()}</span>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </div>
      );
    }

    // Full variant
    return (
      <div className="flex items-center gap-2">
        {showFlags && <span className="text-lg leading-none">{currentLocale?.flag}</span>}
        <span className="font-medium hidden sm:inline">{currentLocale?.name}</span>
        <span className="font-medium sm:hidden">{currentLocale?.code.toUpperCase()}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>
    );
  };

  // Animation variants for performance
  const dropdownVariants = {
    closed: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15, ease: "easeOut" }
    },
    open: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -10 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.02, duration: 0.15 }
    })
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={cn(
            'relative h-9 px-3 border border-border dark:border-border/50 hover:border-border dark:border-border',
            'bg-background/80 backdrop-blur-sm',
            'hover:bg-accent/80 transition-all duration-200',
            'focus:ring-2 focus:ring-primary/20 focus:outline-none',
            isLoading && 'opacity-50 cursor-not-allowed',
            isMobile && 'h-10 px-4',
            isOpen && 'bg-accent/80'
          )}
          aria-label={`Current language: ${currentLocale?.name}. Click to change language.`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {renderTriggerContent()}
          
          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              className={cn(
                'absolute right-0 z-50 mt-2 min-w-[200px] max-w-[280px]',
                'bg-popover/95 backdrop-blur-xl border border-border dark:border-border/50',
                'rounded-lg shadow-2xl shadow-black/20',
                'p-1 max-h-80 overflow-y-auto',
                isMobile && 'left-0 right-0 min-w-full'
              )}
              variants={dropdownVariants}
              initial="closed"
              animate="open"
              exit="closed"
              role="listbox"
              aria-label="Language selection"
            >
              {SUPPORTED_LOCALES.map((localeInfo, index) => {
                const isActive = locale === localeInfo.code;
                
                return (
                  <motion.button
                    key={localeInfo.code}
                    custom={index}
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md',
                      'text-left text-sm transition-all duration-150',
                      'hover:bg-accent focus:bg-accent focus:outline-none',
                      'focus:ring-2 focus:ring-primary/20',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleLanguageChange(localeInfo.code)}
                    onKeyDown={(e) => handleKeyDown(e, localeInfo.code)}
                    role="option"
                    aria-selected={isActive}
                    aria-label={`Select ${localeInfo.name} (${localeInfo.nativeName})`}
                  >
                    {/* Flag */}
                    <motion.span 
                      className="text-xl leading-none flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.1 }}
                    >
                      {localeInfo.flag}
                    </motion.span>
                    
                    {/* Language Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {localeInfo.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {localeInfo.nativeName}
                      </div>
                    </div>
                    
                    {/* Active Indicator */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
              
              {/* Language Count Indicator */}
              <div className="px-3 py-2 border-t border-border dark:border-border/50 mt-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Languages className="h-3 w-3" />
                  <span>{SUPPORTED_LOCALES.length} languages available</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastLanguageToggle;