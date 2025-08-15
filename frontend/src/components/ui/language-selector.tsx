/**
 * Language Selector Component with Badge
 * Professional language switcher for the navbar
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeStore } from '@/store/theme';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useThemeStore();
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 px-3 py-2 h-auto text-sm font-medium bg-background/10 backdrop-blur-sm border border-border dark:border-border/20 hover:bg-background/20 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-2xl leading-none">{currentLanguage.flag}</span>
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
            >
              {currentLanguage.code.toUpperCase()}
            </Badge>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-48 bg-background/95 backdrop-blur-xl border border-border dark:border-border/20 shadow-xl"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-primary/10 ${
                    language === lang.code ? 'bg-primary/5 text-primary' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{lang.name}</span>
                  </div>
                  <Badge 
                    variant={language === lang.code ? "default" : "outline"}
                    className="text-xs"
                  >
                    {lang.code.toUpperCase()}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
};