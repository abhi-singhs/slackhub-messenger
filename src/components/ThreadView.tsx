import { useState, useRef, useEffect } from 'react'
import { Message, UserInfo, Channel, UserStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageItem } from '@/components/MessageItem'
import { MessageInput } from '@/components/MessageInput'
import { EmojiPicker } from '@/components/EmojiPicker'
import { formatTime } from '@/lib/utils'
import { X, Smiley } from '@phosphor-icons/react'

interface ThreadViewProps {
  parentMessage: Message
  threadMessages: Message[]
  user: UserInfo
  channels: Channel[]
  userStatus: UserStatus
  openEmojiPickers: Set<string>
  onClose: () => void
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  onSendThreadReply: (content: string, threadId: string) => void
}

export function ThreadView({
  parentMessage,
  threadMessages,
  user,
  channels,
  userStatus,
  openEmojiPickers,
  onClose,
  onEmojiPickerToggle,
  onReactionAdd,
  onSendThreadReply
}: ThreadViewProps) {
  const [messageInput, setMessageInput] = useState('')
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Don't close if clicking inside the modal
      if (modalRef.current && modalRef.current.contains(target)) {
        return
      }
      
      // Don't close if clicking on an emoji picker or its buttons
      const clickedElement = target as Element
      if (clickedElement && (
        clickedElement.closest('.emoji-picker') ||
        clickedElement.closest('[data-emoji-picker]') ||
        clickedElement.closest('button[data-emoji]')
      )) {
        return
      }
      
      onClose()
    }

    // Add event listener when modal is mounted
    document.addEventListener('mousedown', handleClickOutside)
    
    // Cleanup event listener when modal is unmounted
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendThreadReply(messageInput, parentMessage.id)
      setMessageInput('')
    }
  }

  const sortedThreadMessages = [...threadMessages].sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">Thread</div>
            <div className="text-sm text-muted-foreground">
              {(parentMessage.replyCount || 0) > 0 && `${parentMessage.replyCount} replies`}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Parent Message */}
          <div className="pb-4 border-b">
            <div className="flex items-start gap-3 group">
              <Avatar className="w-10 h-10 flex-shrink-0" showOnlineIndicator={true}>
                <AvatarImage 
                  src={parentMessage.userAvatar || ''} 
                  alt={parentMessage.userName} 
                  showOnlineIndicator={true}
                  status={parentMessage.userId === user?.id ? userStatus : 'active'}
                />
                <AvatarFallback>{parentMessage.userName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {parentMessage.userName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(parentMessage.timestamp)}
                  </span>
                  <div className="relative ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-all duration-200"
                      onClick={() => onEmojiPickerToggle(parentMessage.id, !openEmojiPickers.has(parentMessage.id))}
                      data-emoji-picker
                    >
                      <Smiley className="h-4 w-4" />
                    </Button>
                    {openEmojiPickers.has(parentMessage.id) && (
                      <div className="absolute top-8 right-0 z-50">
                        <div className="w-0.5 h-2 bg-border mx-auto mb-1"></div>
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            onReactionAdd(parentMessage.id, emoji.native)
                            onEmojiPickerToggle(parentMessage.id, false)
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm">
                  <div 
                    className="prose-sm" 
                    dangerouslySetInnerHTML={{ __html: parentMessage.content }}
                  />
                  {parentMessage.reactions && parentMessage.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {parentMessage.reactions.map((reaction) => (
                        <button
                          key={reaction.emoji}
                          onClick={() => onReactionAdd(parentMessage.id, reaction.emoji)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-secondary hover:bg-secondary/80 transition-colors"
                          title={`${reaction.users.length} user${reaction.users.length === 1 ? '' : 's'} reacted with ${reaction.emoji}`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-xs text-muted-foreground">{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thread Replies */}
          {sortedThreadMessages.length > 0 ? (
            <div className="space-y-3">
              {sortedThreadMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  user={user}
                  userStatus={userStatus}
                  isEmojiPickerOpen={openEmojiPickers.has(message.id)}
                  onEmojiPickerToggle={(open) => onEmojiPickerToggle(message.id, open)}
                  onReactionAdd={onReactionAdd}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No replies yet. Start the conversation!</p>
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="border-t">
          <MessageInput
            user={user}
            messageInput={messageInput}
            showInputEmojiPicker={showInputEmojiPicker}
            onMessageInput={setMessageInput}
            onInputEmojiPickerToggle={setShowInputEmojiPicker}
            onSendMessage={handleSendMessage}
            currentChannel={parentMessage.channelId}
            channels={channels}
            placeholder={`Reply to ${parentMessage.userName}...`}
            isThreadReply={true}
          />
        </div>
      </div>
    </div>
  )
}