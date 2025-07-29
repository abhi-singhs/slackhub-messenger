import { useState, useRef, useEffect } from 'react'
import { Message, UserInfo, Channel, UserStatus, FileAttachment } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageItem } from '@/components/MessageItem'
import { MessageInput } from '@/components/MessageInput'
import { EmojiPicker } from '@/components/EmojiPicker'
import { FileAttachmentView } from '@/components/FileAttachmentView'
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
  onSendThreadReply: (content: string, threadId: string, attachments?: FileAttachment[]) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
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
  onSendThreadReply,
  onEditMessage,
  onDeleteMessage
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

  const handleSendMessage = (attachments?: FileAttachment[]) => {
    if (messageInput.trim() || (attachments && attachments.length > 0)) {
      onSendThreadReply(messageInput, parentMessage.id, attachments)
      setMessageInput('')
    }
  }

  const sortedThreadMessages = Array.isArray(threadMessages) ? [...threadMessages].sort((a, b) => a.timestamp - b.timestamp) : []

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
            <MessageItem
              message={parentMessage}
              user={user}
              userStatus={userStatus}
              isEmojiPickerOpen={openEmojiPickers.has(parentMessage.id)}
              onEmojiPickerToggle={(open) => onEmojiPickerToggle(parentMessage.id, open)}
              onReactionAdd={onReactionAdd}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              showReactionsOnly={false}
            />
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
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
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