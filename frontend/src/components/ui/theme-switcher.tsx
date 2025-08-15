/**
 * Theme Switcher Component
 * Allows users to toggle between dark/light mode and color schemes
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useThemeStore, ColorScheme } from '@/store/theme';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Check,
  Settings
} from 'lucide-react';

const colorSchemes: { scheme: ColorScheme; name: string; color: string; icon: string }[] = [
  { scheme: 'red', name: 'Red', color: 'bg-red-500', icon: '🔴' },
  { scheme: 'blue', name: 'Blue', color: 'bg-blue-500', icon: '🔵' },
  { scheme: 'black', name: 'Black', color: 'bg-background', icon: '⚫' },
  { scheme: 'green', name: 'Green', color: 'bg-green-500', icon: '🟢' },
  { scheme: 'purple', name: 'Purple', color: 'bg-purple-500', icon: '🟣' },
];

export const ThemeSwitcher: React.FC = () => {
  const { mode, colorScheme, setMode, setColorScheme, toggleMode } = useThemeStore();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentScheme = colorSchemes.find(s => s.scheme === colorScheme) || colorSchemes[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 px-3 py-2 h-auto text-sm font-medium bg-background/10 backdrop-blur-sm border border-border dark:border-border/20 hover:bg-background/20 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <motion.div
              key={mode}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </motion.div>
            <div className={`w-3 h-3 rounded-full ${currentScheme.color} border border-border dark:border-border/20`} />
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
            >
              {mode === 'dark' ? 'Dark' : 'Light'}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-56 bg-background/95 backdrop-blur-xl border border-border dark:border-border/20 shadow-xl"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
                Theme Mode
              </DropdownMenuLabel>
              
              <DropdownMenuItem
                onClick={() => setMode('light')}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-primary/10"
              >
                <Sun className="h-4 w-4" />
                <span className="flex-1">Light</span>
                {mode === 'light' && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => setMode('dark')}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-primary/10"
              >
                <Moon className="h-4 w-4" />
                <span className="flex-1">Dark</span>
                {mode === 'dark' && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
                Color Scheme
              </DropdownMenuLabel>
              
              {colorSchemes.map((scheme) => (
                <DropdownMenuItem
                  key={scheme.scheme}
                  onClick={() => setColorScheme(scheme.scheme)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-primary/10"
                >
                  <div className={`w-4 h-4 rounded-full ${scheme.color} border border-border dark:border-border/20`} />
                  <span className="flex-1">{scheme.name}</span>
                  <span className="text-lg">{scheme.icon}</span>
                  {colorScheme === scheme.scheme && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
};