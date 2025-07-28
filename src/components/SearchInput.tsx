import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, X } from '@phosphor-icons/react'

interface SearchInputProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export const SearchInput = ({ searchQuery, onSearchChange, placeholder = "Search messages..." }: SearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false)

  // Keyboard shortcut to focus search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
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
          type="text"
          placeholder={`${placeholder} (⌘K)`}
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