import { Channel } from '@/types'
import { RichTextEditor } from './RichTextEditor'

interface MessageInputProps {
  channels: Channel[]
  currentChannel: string
  messageInput: string
  showInputEmojiPicker: boolean
  onMessageInput: (content: string) => void
  onEmojiPickerToggle: (show: boolean) => void
  onSendMessage: () => void
}

export const MessageInput = ({
  channels,
  currentChannel,
  messageInput,
  showInputEmojiPicker,
  onMessageInput,
  onEmojiPickerToggle,
  onSendMessage
}: MessageInputProps) => {
  const currentChannelName = channels.find(c => c.id === currentChannel)?.name || currentChannel

  return (
    <div className="p-2 sm:p-4 border-t border-border bg-card">
      <RichTextEditor
        content={messageInput}
        placeholder={`Message #${currentChannelName}`}
        showEmojiPicker={showInputEmojiPicker}
        onUpdate={onMessageInput}
        onEmojiPickerToggle={onEmojiPickerToggle}
        onSubmit={onSendMessage}
        showSendButton={true}
      />
    </div>
  )
}