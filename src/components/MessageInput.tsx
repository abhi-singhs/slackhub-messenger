import { Channel, UserInfo } from '@/types'
import { RichTextEditor } from './RichTextEditor'

interface MessageInputProps {
  user: UserInfo | null
  channels: Channel[]
  currentChannel: string
  messageInput: string
  showInputEmojiPicker: boolean
  placeholder?: string
  isThreadReply?: boolean
  onMessageInput: (content: string) => void
  onEmojiPickerToggle: (show: boolean) => void
  onSendMessage: () => void
}

export const MessageInput = ({
  user,
  channels,
  currentChannel,
  messageInput,
  showInputEmojiPicker,
  placeholder,
  isThreadReply = false,
  onMessageInput,
  onEmojiPickerToggle,
  onSendMessage
}: MessageInputProps) => {
  const currentChannelName = channels?.find(c => c.id === currentChannel)?.name || currentChannel
  const defaultPlaceholder = placeholder || `Message #${currentChannelName}`

  return (
    <div className={`p-2 sm:p-4 border-t border-border bg-card ${isThreadReply ? 'rounded-b-lg' : ''}`}>
      <RichTextEditor
        content={messageInput}
        placeholder={defaultPlaceholder}
        showEmojiPicker={showInputEmojiPicker}
        onUpdate={onMessageInput}
        onEmojiPickerToggle={onEmojiPickerToggle}
        onSubmit={onSendMessage}
        showSendButton={true}
      />
    </div>
  )
}