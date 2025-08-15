/**
 * 🎨 Enhanced Theme Provider for SGPT
 * Supports dynamic switching between futuristic dark/blue/black/purple themes
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Theme = 'dark-blue' | 'dark-black' | 'dark-purple'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark-blue',
  storageKey = 'sgpt-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('theme-dark-blue', 'theme-dark-black', 'theme-dark-purple')

    // Add theme switching class to disable transitions
    root.classList.add('theme-switching')

    // Add new theme class
    root.classList.add(`theme-${theme}`)

    // Remove theme switching class after a brief delay
    setTimeout(() => {
      root.classList.remove('theme-switching')
    }, 50)
  }, [theme])

  const handleSetTheme = (newTheme: Theme) => {
    setIsChanging(true)
    localStorage.setItem(storageKey, newTheme)
    setTheme(newTheme)

    // Reset changing state after animation
    setTimeout(() => setIsChanging(false), 300)
  }

  const toggleTheme = () => {
    const order: Theme[] = ['dark-blue', 'dark-black', 'dark-purple']
    const idx = order.indexOf(theme)
    const next = order[(idx + 1) % order.length]
    handleSetTheme(next)
  }

  const value = {
    theme,
    setTheme: handleSetTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider {...props} value={value}>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={isChanging ? 'pointer-events-none' : ''}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  )
}

/**
 * Theme Toggle Component
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const themeConfig = {
    'dark-blue': {
      name: 'Dark Blue',
      icon: '🔵',
      description: 'Dark theme with blue accents'
    },
    'dark-black': {
      name: 'Dark Black',
      icon: '⚫',
      description: 'Dark theme with near-black surfaces'
    },
    'dark-purple': {
      name: 'Dark Purple',
      icon: '🟣',
      description: 'Dark theme with purple accents'
    }
  } as const

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center gap-3 p-3 rounded-lg border border-border dark:border-border bg-card/50 backdrop-blur-md hover:bg-card/80 transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="text-2xl"
      >
        {themeConfig[theme].icon}
      </motion.div>

      <div className="text-left">
        <div className="font-medium text-sm">{themeConfig[theme].name}</div>
        <div className="text-xs text-muted-foreground">{themeConfig[theme].description}</div>
      </div>

      <motion.div
        animate={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
        className="text-muted-foreground"
      >
        ⟳
      </motion.div>
    </motion.button>
  )
}

/**
 * Theme Preview Component
 */
export function ThemePreview() {
  const { theme } = useTheme()

  return (
    <motion.div
      className="flex gap-2 p-2 rounded-lg bg-muted/20"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-4 h-4 rounded-full bg-primary"></div>
      <div className="w-4 h-4 rounded-full bg-secondary"></div>
      <div className="w-4 h-4 rounded-full bg-accent"></div>
      <div className="w-4 h-4 rounded-full bg-muted"></div>
    </motion.div>
  )
}