import React, { useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/types/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  /**
   * Size variant of the selector
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show only the flag/icon or include text
   */
  variant?: 'icon' | 'full' | 'compact';
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Whether to show the current language label
   */
  showLabel?: boolean;
  /**
   * Callback when language changes
   */
  onLanguageChange?: (locale: SupportedLocale) => void;
}

/**
 * Language selector component for switching between supported locales
 * 
 * @example
 * ```tsx
 * // Full selector with label
 * <LanguageSelector variant="full" showLabel />
 * 
 * // Icon only version for compact spaces
 * <LanguageSelector variant="icon" size="sm" />
 * 
 * // Compact version with flag and name
 * <LanguageSelector variant="compact" />
 * ```
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  size = 'md',
  variant = 'full',
  className,
  showLabel = false,
  onLanguageChange,
}) => {
  const { locale, setLocale, isLoading, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = SUPPORTED_LOCALES.find(l => l.code === locale);

  const handleLanguageChange = async (newLocale: SupportedLocale) => {
    try {
      await setLocale(newLocale);
      onLanguageChange?.(newLocale);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  const renderTriggerContent = () => {
    switch (variant) {
      case 'icon':
        return (
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
          </div>
        );
      case 'compact':
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLocale?.flag}</span>
            <span className="font-medium">{currentLocale?.code.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        );
      case 'full':
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLocale?.flag}</span>
            <span className="font-medium">{currentLocale?.name}</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        );
    }
  };

  return (
    <div className={cn('relative', className)}>
      {showLabel && (
        <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-1">
          {t('common.language')}
        </label>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isLoading}
            className={cn(
              'justify-between',
              sizeClasses[size],
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={t('common.language')}
          >
            {renderTriggerContent()}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-48 max-h-64 overflow-y-auto"
          sideOffset={4}
        >
          {SUPPORTED_LOCALES.map((localeInfo) => (
            <DropdownMenuItem
              key={localeInfo.code}
              onClick={() => handleLanguageChange(localeInfo.code)}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2 cursor-pointer',
                locale === localeInfo.code && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{localeInfo.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{localeInfo.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {localeInfo.nativeName}
                  </span>
                </div>
              </div>
              {locale === localeInfo.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSelector; 