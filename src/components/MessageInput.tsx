import { Button } from '@/components/ui/button'
import { PaperPlaneRight } from '@phosphor-icons/react'
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
      <div className="flex gap-2">
        <div className="flex-1">
          <RichTextEditor
            content={messageInput}
            placeholder={`Message #${currentChannelName}`}
            showEmojiPicker={showInputEmojiPicker}
            onUpdate={onMessageInput}
            onEmojiPickerToggle={onEmojiPickerToggle}
            onSubmit={onSendMessage}
          />
        </div>
        <Button 
          onClick={onSendMessage} 
          disabled={!messageInput.trim()}
          size="sm"
          className="flex-shrink-0 self-end mb-3"
        >
          <PaperPlaneRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}