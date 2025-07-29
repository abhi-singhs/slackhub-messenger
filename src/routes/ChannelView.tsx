import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserInfo, Channel, Message } from '@/types'
import { MessagesList } from '@/components/MessagesList'
import { MessageInput } from '@/components/MessageInput'

interface ChannelViewProps {
  user: UserInfo
  channels: Channel[]
  messages: Message[]
  openEmojiPickers: Set<string>
  showInputEmojiPicker: boolean
  messageInput: string
  onMessageInput: (value: string) => void
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onInputEmojiPickerToggle: (open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  onSendMessage: () => void
  targetMessageId?: string | null
}

export function ChannelView({
  user,
  channels,
  messages,
  openEmojiPickers,
  showInputEmojiPicker,
  messageInput,
  onMessageInput,
  onEmojiPickerToggle,
  onInputEmojiPickerToggle,
  onReactionAdd,
  onSendMessage,
  targetMessageId
}: ChannelViewProps) {
  const { channelId } = useParams<{ channelId: string }>()

  // Find the current channel
  const currentChannel = channels.find(c => c.id === channelId)

  // Show loading state if no channels are loaded yet or channel not found
  if (!channelId || channels.length === 0 || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading channel...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <MessagesList
        messages={messages}
        channels={channels}
        currentChannel={channelId}
        user={user}
        searchQuery=""
        openEmojiPickers={openEmojiPickers}
        onEmojiPickerToggle={onEmojiPickerToggle}
        onReactionAdd={onReactionAdd}
        targetMessageId={targetMessageId}
      />

      <MessageInput
        channels={channels}
        currentChannel={channelId}
        messageInput={messageInput}
        showInputEmojiPicker={showInputEmojiPicker}
        onMessageInput={onMessageInput}
        onEmojiPickerToggle={onInputEmojiPickerToggle}
        onSendMessage={onSendMessage}
      />
    </>
  )
}