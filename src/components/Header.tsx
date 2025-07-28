import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Hash, List } from '@phosphor-icons/react'
import { Channel } from '@/types'
import { SearchInput } from '@/components/SearchInput'

interface HeaderProps {
  channels: Channel[]
  currentChannel: string
  searchQuery: string
  onSidebarToggle: () => void
  onSearchChange: (query: string) => void
}

export const Header = ({ channels, currentChannel, searchQuery, onSidebarToggle, onSearchChange }: HeaderProps) => {
  const currentChannelData = channels.find(c => c.id === currentChannel)
  
  return (
    <div className="h-14 px-4 flex items-center gap-2 border-b border-border bg-card">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSidebarToggle}
        className="h-8 w-8 p-0 md:hidden mr-2"
      >
        <List className="h-4 w-4" />
      </Button>
      <Hash className="h-5 w-5 text-muted-foreground" />
      <h2 className="font-semibold text-foreground truncate">
        {currentChannelData?.name || currentChannel}
      </h2>
      <Separator orientation="vertical" className="h-6 hidden sm:block" />
      <p className="text-sm text-muted-foreground hidden sm:block truncate">
        {currentChannelData?.description}
      </p>
      
      {/* Search input - takes remaining space */}
      <div className="flex-1 flex justify-end">
        <SearchInput
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          placeholder="Search messages..."
        />
      </div>
    </div>
  )
}