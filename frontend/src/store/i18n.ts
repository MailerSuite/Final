import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  I18nState, 
  SupportedLocale, 
  TranslationKey
} from '@/types/i18n';
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/types/i18n';

// Utility function to detect browser language
const detectBrowserLanguage = (): SupportedLocale => {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  
  const browserLang = navigator.language.toLowerCase();
  const supportedLocales: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru'];
  
  // Try exact match first
  if (supportedLocales.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale;
  }
  
  // Try language code without region (e.g., 'en-US' -> 'en')
  const langCode = browserLang.split('-')[0] as SupportedLocale;
  if (supportedLocales.includes(langCode)) {
    return langCode;
  }
  
  return DEFAULT_LOCALE;
};

// Utility function to get nested object value by dot notation
const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Cache for loaded translations to avoid redundant imports
const translationCache = new Map<SupportedLocale, TranslationKey>();

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: detectBrowserLanguage(),
      translations: null,
      isLoading: false,
      fallbackLocale: FALLBACK_LOCALE,
      loadedLocales: new Set(),

      loadTranslations: async (locale: SupportedLocale) => {
        // Check cache first
        if (translationCache.has(locale)) {
          const cachedTranslations = translationCache.get(locale)!;
          set({ 
            translations: cachedTranslations, 
            loadedLocales: new Set([...get().loadedLocales, locale]) 
          });
          return;
        }

        set({ isLoading: true });
        
        try {
          // Dynamic import for tree-shaking and code splitting
          const translationModule = await import(`../locales/${locale}.ts`);
          const translations = translationModule.default as TranslationKey;
          
          // Cache the translations
          translationCache.set(locale, translations);
          
          set({ 
            translations, 
            isLoading: false,
            loadedLocales: new Set([...get().loadedLocales, locale])
          });
        } catch (error) {
          console.warn(`Failed to load translations for locale: ${locale}`, error);
          
          // Fallback to default locale if different from current
          if (locale !== get().fallbackLocale) {
            await get().loadTranslations(get().fallbackLocale);
          } else {
            set({ isLoading: false });
          }
        }
      },

      setLocale: async (locale: SupportedLocale) => {
        const currentState = get();
        
        // Don't reload if already current locale
        if (currentState.locale === locale && currentState.loadedLocales.has(locale)) {
          return;
        }

        set({ locale });
        await currentState.loadTranslations(locale);
        
        // Update document language attribute for accessibility
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale;
          
          // Set text direction for RTL languages
          const rtlLocales: SupportedLocale[] = ['ar'];
          document.documentElement.dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
        }
      },

      t: (key: string, params?: Record<string, string | number>) => {
        const state = get();
        let translation = getNestedValue(state.translations, key);
        
        // Fallback to English if translation not found
        if (!translation && state.locale !== state.fallbackLocale) {
          const fallbackTranslations = translationCache.get(state.fallbackLocale);
          translation = getNestedValue(fallbackTranslations, key);
        }
        
        // Return key as fallback if no translation found
        if (!translation) {
          console.warn(`Translation missing for key: ${key} in locale: ${state.locale}`);
          return key;
        }

        // Replace parameters in translation string
        if (params) {
          return Object.entries(params).reduce(
            (text, [paramKey, value]) => 
              text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value)),
            translation
          );
        }

        return translation;
      },

      formatMessage: (key: string, params?: Record<string, string | number>) => {
        return get().t(key, params);
      },
    }),
    {
      name: 'i18n-storage',
      partialize: (state) => ({ 
        locale: state.locale 
      }),
      onRehydrateStorage: () => (state) => {
        // Load translations for persisted locale on app startup
        if (state?.locale) {
          state.loadTranslations(state.locale);
        }
      },
    }
  )
);

// Initialize translations on store creation
if (typeof window !== 'undefined') {
  const store = useI18nStore.getState();
  store.loadTranslations(store.locale);
} 