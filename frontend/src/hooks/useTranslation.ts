import { useCallback } from 'react';
import { useI18nStore } from '@/store/i18n';
import type { SupportedLocale } from '@/types/i18n';

/**
 * Hook for accessing translations and i18n functionality
 * 
 * @example
 * ```tsx
 * const { t, locale, setLocale, isLoading } = useTranslation();
 * 
 * return (
 *   <div>
 *     <h1>{t('common.loading')}</h1>
 *     <p>{t('errors.minLength', { min: 8 })}</p>
 *     <button onClick={() => setLocale('es')}>
 *       Switch to Spanish
 *     </button>
 *   </div>
 * );
 * ```
 */
export const useTranslation = () => {
  const {
    locale,
    translations,
    isLoading,
    loadedLocales,
    setLocale: storeSetLocale,
    t: storeT,
    formatMessage,
  } = useI18nStore();

  /**
   * Change the current locale
   */
  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    try {
      await storeSetLocale(newLocale);
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  }, [storeSetLocale]);

  /**
   * Get translation for a key with optional parameters
   * @param key - Translation key in dot notation (e.g., 'common.loading')
   * @param params - Optional parameters for interpolation
   */
  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return storeT(key, params);
  }, [storeT]);

  /**
   * Format message with parameters (alias for t)
   */
  const formatMsg = useCallback((key: string, params?: Record<string, string | number>) => {
    return formatMessage(key, params);
  }, [formatMessage]);

  /**
   * Check if a locale is currently loaded
   */
  const isLocaleLoaded = useCallback((checkLocale: SupportedLocale) => {
    return loadedLocales.has(checkLocale);
  }, [loadedLocales]);

  /**
   * Get current RTL status
   */
  const isRTL = useCallback(() => {
    const rtlLocales: SupportedLocale[] = ['ar'];
    return rtlLocales.includes(locale);
  }, [locale]);

  /**
   * Get localized date formatting
   */
  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, options);
  }, [locale]);

  /**
   * Get localized time formatting
   */
  const formatTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(locale, options);
  }, [locale]);

  /**
   * Get localized number formatting
   */
  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions) => {
    return number.toLocaleString(locale, options);
  }, [locale]);

  /**
   * Get localized currency formatting
   */
  const formatCurrency = useCallback((amount: number, currency = 'USD', options?: Intl.NumberFormatOptions) => {
    return amount.toLocaleString(locale, {
      style: 'currency',
      currency,
      ...options,
    });
  }, [locale]);

  /**
   * Get localized relative time formatting (e.g., "2 minutes ago")
   */
  const formatRelativeTime = useCallback((date: Date | string | number, options?: Intl.RelativeTimeFormatOptions) => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(locale, options);
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ] as const;
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        return rtf.format(diffInSeconds < 0 ? -count : count, interval.label);
      }
    }
    
    return rtf.format(0, 'second');
  }, [locale]);

  return {
    // Core translation functions
    t,
    formatMsg,
    formatMessage,
    
    // Locale management
    locale,
    setLocale,
    isLocaleLoaded,
    isRTL,
    
    // Loading state
    isLoading,
    translations,
    
    // Localized formatting utilities
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  };
};

export default useTranslation; 