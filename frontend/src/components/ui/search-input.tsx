import React from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  debounceMs?: number
  showSearchButton?: boolean
  showClearButton?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'filled'
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  disabled = false,
  loading = false,
  debounceMs = 300,
  showSearchButton = false,
  showClearButton = true,
  className,
  size = 'md',
  variant = 'default',
}) => {
  const [localValue, setLocalValue] = React.useState(value)
  const [isFocused, setIsFocused] = React.useState(false)
  const debounceRef = React.useRef<NodeJS.Timeout>()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Sync external value changes
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced onChange
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localValue, onChange, debounceMs, value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const handleSearch = () => {
    if (onSearch) {
      onSearch(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault()
      handleSearch()
    }
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg',
  }

  const variantClasses = {
    default: 'border-input bg-background',
    ghost: 'border-transparent bg-transparent hover:border-input hover:bg-background/50',
    filled: 'border-transparent bg-muted',
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Field */}
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-10 transition-all duration-200',
            sizeClasses[size],
            variantClasses[variant],
            isFocused && 'ring-2 ring-primary/20 border-primary',
            'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary'
          )}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {showClearButton && localValue && !disabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Button */}
      {showSearchButton && (
        <Button
          type="button"
          size={size}
          onClick={handleSearch}
          disabled={disabled || loading}
          className="ml-2 px-6"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search
        </Button>
      )}
    </div>
  )
}

// Search input with suggestions/autocomplete
interface SearchWithSuggestionsProps extends SearchInputProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
  showSuggestions?: boolean
  maxSuggestions?: number
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  showSuggestions = true,
  maxSuggestions = 5,
  ...searchProps
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

  const filteredSuggestions = React.useMemo(() => {
    if (!searchProps.value || !showSuggestions) return []
    
    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(searchProps.value!.toLowerCase())
      )
      .slice(0, maxSuggestions)
  }, [suggestions, searchProps.value, showSuggestions, maxSuggestions])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          onSuggestionClick(filteredSuggestions[highlightedIndex])
          setIsOpen(false)
        } else if (searchProps.onSearch) {
          searchProps.onSearch(searchProps.value || '')
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  React.useEffect(() => {
    setIsOpen(filteredSuggestions.length > 0)
    setHighlightedIndex(-1)
  }, [filteredSuggestions.length])

  return (
    <div className="relative">
      <SearchInput
        {...searchProps}
        onKeyDown={handleKeyDown}
      />
      
      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 glass-card"
          >
            <div className="p-1">
              {filteredSuggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                    'hover:bg-sidebar-accent/20 focus:bg-sidebar-accent/20',
                    index === highlightedIndex && 'bg-sidebar-accent/20'
                  )}
                  onClick={() => {
                    onSuggestionClick(suggestion)
                    setIsOpen(false)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchInput