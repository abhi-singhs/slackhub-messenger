import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Hash, List, Phone } from '@phosphor-icons/react'
import { Channel, UserInfo, CallParticipant } from '@/types'
import { SearchInput } from '@/components/SearchInput'
import { SettingsModal } from '@/components/SettingsModal'
import { CallDialog } from '@/components/CallDialog'
import { Call } from '@/types'

interface HeaderProps {
  channels: Channel[]
  currentChannel: string
  searchQuery: string
  user?: UserInfo
  callHistory?: Call[]
  onSidebarToggle: () => void
  onSearchChange: (query: string) => void
  onStartCall?: (type: 'voice' | 'video', participants: CallParticipant[], channelId?: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export const Header = ({ 
  channels, 
  currentChannel, 
  searchQuery, 
  user,
  callHistory = [],
  onSidebarToggle, 
  onSearchChange, 
  onStartCall,
  searchInputRef 
}: HeaderProps) => {
  const currentChannelData = Array.isArray(channels) ? channels.find(c => c.id === currentChannel) : null
  
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
        {currentChannelData?.name || 'Loading...'}
      </h2>
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
        
        {/* Call Dialog */}
        {user && onStartCall && (
          <CallDialog
            user={user}
            channels={channels}
            callHistory={callHistory}
            onStartCall={onStartCall}
          >
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="h-4 w-4" />
            </Button>
          </CallDialog>
        )}
        
        <SettingsModal />
      </div>
    </div>
  )
}