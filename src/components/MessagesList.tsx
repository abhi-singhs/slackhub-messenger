import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Hash } from '@phosphor-icons/react'
import { Message, UserInfo } from '@/types'
import { MessageItem } from './MessageItem'

interface MessagesListProps {
  messages: Message[]
  user: UserInfo | null
  openEmojiPickers: Set<string>
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
}

export const MessagesList = ({
  messages,
  user,
  openEmojiPickers,
  onEmojiPickerToggle,
  onReactionAdd
}: MessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full p-2 sm:p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome to the channel
              </h3>
              <p className="text-muted-foreground px-4">
                This is the beginning of your conversation. Start chatting!
              </p>
            </div>
          ) : (
            <TooltipProvider>
              {messages.map((message) => (
                <div key={message.id} id={`message-${message.id}`}>
                  <MessageItem
                    message={message}
                    user={user}
                    messages={messages}
                    searchQuery=""
                    isEmojiPickerOpen={openEmojiPickers.has(message.id)}
                    onEmojiPickerToggle={(open) => onEmojiPickerToggle(message.id, open)}
                    onReactionAdd={onReactionAdd}
                  />
                </div>
              ))}
            </TooltipProvider>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  )
}