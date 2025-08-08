import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Hash, List } from '@phosphor-icons/react'
import { Channel, UserInfo } from '@/types'
import { SearchInput } from '@/components/SearchInput'

interface HeaderProps {
  channels: Channel[]
  currentChannel: string
  searchQuery: string
  user?: UserInfo
  onSidebarToggle: () => void
  onSearchChange: (query: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export const Header = ({ 
  channels, 
  currentChannel, 
  searchQuery, 
  user,
  onSidebarToggle, 
  onSearchChange, 
  searchInputRef 
}: HeaderProps) => {
  const currentChannelData = Array.isArray(channels) ? channels.find(c => c.id === currentChannel) : null
  
  return (
    <div className="sticky top-0 z-10 h-14 px-4 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSidebarToggle}
        className="h-8 w-8 p-0 md:hidden mr-2"
      >
        <List className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 min-w-0">
        <Hash className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-foreground truncate">
          {currentChannelData?.name || 'Loading...'}
        </h2>
      </div>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <p className="text-sm text-muted-foreground hidden sm:block truncate">
        {currentChannelData?.description || ''}
      </p>
      
      {/* Search input, call button, and settings */}
  <div className="flex-1 flex items-center justify-end gap-2">
        <SearchInput
          ref={searchInputRef}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          placeholder="Search messages..."
        />
      </div>
    </div>
  )
}