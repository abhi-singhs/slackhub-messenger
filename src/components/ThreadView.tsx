import { useState } from 'react'
import { Message, UserInfo, Channel } from '@/types'
import { Button } from '@/components/ui/button'
import { MessageItem } from '@/components/MessageItem'
import { MessageInput } from '@/components/MessageInput'
import { X } from '@phosphor-icons/react'

interface ThreadViewProps {
  parentMessage: Message
  threadMessages: Message[]
  user: UserInfo
  channels: Channel[]
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
  openEmojiPickers,
  onClose,
  onEmojiPickerToggle,
  onReactionAdd,
  onSendThreadReply
}: ThreadViewProps) {
  const [messageInput, setMessageInput] = useState('')
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendThreadReply(messageInput, parentMessage.id)
      setMessageInput('')
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const sortedThreadMessages = [...threadMessages].sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
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
            <div className="flex items-start gap-3">
              <img
                src={parentMessage.userAvatar || '/default-avatar.png'}
                alt=""
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {parentMessage.userName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(parentMessage.timestamp)}
                  </span>
                </div>
                <div
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: parentMessage.content }}
                />
                <MessageItem
                  message={parentMessage}
                  user={user}
                  openEmojiPickers={openEmojiPickers}
                  onEmojiPickerToggle={onEmojiPickerToggle}
                  onReactionAdd={onReactionAdd}
                  showReactionsOnly={true}
                />
              </div>
            </div>
          </div>

          {/* Thread Replies */}
          {sortedThreadMessages.length > 0 ? (
            <div className="space-y-3">
              {sortedThreadMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <img
                    src={message.userAvatar || '/default-avatar.png'}
                    alt=""
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {message.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                    <MessageItem
                      message={message}
                      user={user}
                      openEmojiPickers={openEmojiPickers}
                      onEmojiPickerToggle={onEmojiPickerToggle}
                      onReactionAdd={onReactionAdd}
                      showReactionsOnly={true}
                    />
                  </div>
                </div>
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