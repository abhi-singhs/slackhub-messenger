import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MagnifyingGlass, Hash } from '@phosphor-icons/react'
import { Channel } from '@/types'

interface QuickSwitcherProps {
  isOpen: boolean
  onClose: () => void
  channels: Channel[]
  currentChannel: string | null
  onChannelSelect: (channelId: string) => void
}

export const QuickSwitcher = ({ 
  isOpen, 
  onClose, 
  channels, 
  currentChannel, 
  onChannelSelect 
}: QuickSwitcherProps) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredChannels = Array.isArray(channels) ? channels.filter(channel =>
    channel.name.toLowerCase().includes(query.toLowerCase()) ||
    channel.description?.toLowerCase().includes(query.toLowerCase())
  ) : []

  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId)
    onClose()
    setQuery('')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && filteredChannels.length > 0) {
      handleChannelSelect(filteredChannels[0].id)
    } else if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      // Focus first channel in list
      const firstChannel = document.querySelector('[data-channel-item]') as HTMLElement
      if (firstChannel) {
        firstChannel.focus()
      }
    }
  }

  const handleChannelKeyDown = (event: React.KeyboardEvent, channelId: string, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleChannelSelect(channelId)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextChannel = document.querySelector(`[data-channel-index="${index + 1}"]`) as HTMLElement
      if (nextChannel) {
        nextChannel.focus()
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (index === 0) {
        inputRef.current?.focus()
      } else {
        const prevChannel = document.querySelector(`[data-channel-index="${index - 1}"]`) as HTMLElement
        if (prevChannel) {
          prevChannel.focus()
        }
      }
    } else if (event.key === 'Escape') {
      onClose()
    }
  }

  // Reset query when dialog opens
  if (isOpen && query === '') {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <MagnifyingGlass size={20} />
            Switch to...
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <Input
            ref={inputRef}
            placeholder="Type to search channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>

        <ScrollArea className="max-h-96">
          <div className="px-2 pb-4">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MagnifyingGlass size={32} className="mx-auto mb-2 opacity-50" />
                <p>No channels found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChannels.map((channel, index) => (
                  <div
                    key={channel.id}
                    data-channel-item
                    data-channel-index={index}
                    tabIndex={0}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring hover:bg-muted ${
                      channel.id === currentChannel ? 'bg-accent text-accent-foreground' : ''
                    }`}
                    onClick={() => handleChannelSelect(channel.id)}
                    onKeyDown={(e) => handleChannelKeyDown(e, channel.id, index)}
                  >
                    <Hash size={16} className="text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{channel.name}</span>
                        {channel.id === currentChannel && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      {channel.description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {channel.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="px-6 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}