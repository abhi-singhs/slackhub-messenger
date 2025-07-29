import { useState, useEffect, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, X } from '@phosphor-icons/react'

interface SearchInputProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ searchQuery, onSearchChange, placeholder = "Search messages..." }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && searchQuery && searchQuery.trim()) {
        // Trigger search results when Enter is pressed
        if (searchQuery.length >= 2) {
          // The parent component handles showing search results
        }
      }
    }

    const handleClear = () => {
      onSearchChange('')
    }

    return (
      <div className="relative flex items-center">
        <div className={`relative flex items-center transition-all duration-200 ${
          isFocused ? 'flex-1' : 'w-64'
        }`}>
          <MagnifyingGlass className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={ref}
            type="text"
            placeholder={`${placeholder} (⌘F)`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-10 pr-10 h-8 text-sm bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)