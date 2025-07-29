import { Channel, UserInfo, FileAttachment } from '@/types'
import { RichTextEditor } from './RichTextEditor'
import { FileUpload } from './FileUpload'
import { forwardRef, useState } from 'react'

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
  onSendMessage: (attachments?: FileAttachment[]) => void
}

export const MessageInput = forwardRef<HTMLDivElement, MessageInputProps>(({
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
}, ref) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [fileUploadCallback, setFileUploadCallback] = useState<(() => void) | null>(null)
  
  const currentChannelName = channels?.find(c => c.id === currentChannel)?.name || currentChannel
  const defaultPlaceholder = placeholder || `Message #${currentChannelName}`

  const handleSendMessage = () => {
    onSendMessage(attachments.length > 0 ? attachments : undefined)
    setAttachments([]) // Clear attachments after sending
  }

  const handleFileUploadClick = () => {
    if (fileUploadCallback) {
      fileUploadCallback()
    }
  }

  const handleFileUploadCallbackRegistration = (callback: () => void) => {
    setFileUploadCallback(() => callback)
  }

  return (
    <div className={`p-2 sm:p-4 border-t border-border bg-card ${isThreadReply ? 'rounded-b-lg' : ''}`}>
      <div className="space-y-2">
        {/* File Upload Component */}
        <FileUpload
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          onFileUploadClick={handleFileUploadCallbackRegistration}
        />
        
        {/* Rich Text Editor */}
        <RichTextEditor
          ref={ref}
          content={messageInput}
          placeholder={defaultPlaceholder}
          showEmojiPicker={showInputEmojiPicker}
          onUpdate={onMessageInput}
          onEmojiPickerToggle={onEmojiPickerToggle}
          onSubmit={handleSendMessage}
          showSendButton={true}
          hasAttachments={attachments.length > 0}
          onFileUploadClick={handleFileUploadClick}
        />
      </div>
    </div>
  )
})