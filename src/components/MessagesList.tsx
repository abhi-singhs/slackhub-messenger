import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Hash, MagnifyingGlass } from '@phosphor-icons/react'
import { Message, Channel, UserInfo } from '@/types'
import { searchMessages } from '@/lib/utils'
import { MessageItem } from './MessageItem'

interface MessagesListProps {
  messages: Message[]
  channels: Channel[]
  currentChannel: string
  user: UserInfo | null
  searchQuery: string
  openEmojiPickers: Set<string>
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  targetMessageId?: string | null
}

export const MessagesList = ({
  messages,
  channels,
  currentChannel,
  user,
  searchQuery,
  openEmojiPickers,
  onEmojiPickerToggle,
  onReactionAdd,
  targetMessageId
}: MessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get messages for current channel
  const currentChannelMessages = (messages || []).filter(msg => msg.channelId === currentChannel)
  
  // Apply search filtering if search query exists
  const filteredMessages = searchQuery && searchQuery.trim() 
    ? searchMessages(currentChannelMessages, searchQuery) 
    : currentChannelMessages

  useEffect(() => {
    // Only auto-scroll if there's no active search
    if (!searchQuery || !searchQuery.trim()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, currentChannel, searchQuery])

  const currentChannelData = channels?.find(c => c.id === currentChannel)

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full p-2 sm:p-4">
        <div className="space-y-4">
          {/* Show search results info */}
          {searchQuery && searchQuery.trim() && (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <MagnifyingGlass className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">
                {filteredMessages.length === 0 
                  ? `No messages found for "${searchQuery}"` 
                  : `Found ${filteredMessages.length} message${filteredMessages.length === 1 ? '' : 's'} for "${searchQuery}"`
                }
              </span>
            </div>
          )}
          
          {filteredMessages.length === 0 && (!searchQuery || !searchQuery.trim()) ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome to #{currentChannelData?.name}
              </h3>
              <p className="text-muted-foreground px-4">
                This is the beginning of your conversation. Start chatting!
              </p>
            </div>
          ) : filteredMessages.length > 0 ? (
            <TooltipProvider>
              {filteredMessages.map((message) => {
                const isTargetMessage = targetMessageId === message.id
                return (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={`transition-all duration-500 ${
                      isTargetMessage ? 'ring-2 ring-accent/50 bg-accent/5 rounded-lg p-2' : ''
                    }`}
                  >
                    <MessageItem
                      message={message}
                      user={user}
                      messages={messages}
                      searchQuery={searchQuery}
                      isEmojiPickerOpen={openEmojiPickers.has(message.id)}
                      onEmojiPickerToggle={(open) => onEmojiPickerToggle(message.id, open)}
                      onReactionAdd={onReactionAdd}
                    />
                  </div>
                )
              })}
            </TooltipProvider>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  )
}