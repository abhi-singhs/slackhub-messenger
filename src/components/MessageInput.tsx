import { Channel, UserInfo, FileAttachment } from '@/types'
import { RichTextEditor, RichTextEditorHandle } from './RichTextEditor'
import { FileUpload } from './FileUpload'
import { forwardRef, useState, useRef } from 'react'

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

export const MessageInput = forwardRef<RichTextEditorHandle, MessageInputProps>(({ 
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
  const fileUploadRef = useRef<{ triggerFileUpload: () => void } | null>(null)
  
  const currentChannelName = Array.isArray(channels) ? channels.find(c => c.id === currentChannel)?.name : currentChannel || ''
  const defaultPlaceholder = placeholder || `Message #${currentChannelName}`

  const handleSendMessage = () => {
    onSendMessage(attachments.length > 0 ? attachments : undefined)
    setAttachments([]) // Clear attachments after sending
  }

  const handleFileUploadClick = () => {
    if (fileUploadRef.current) {
      fileUploadRef.current.triggerFileUpload()
    }
  }

  return (
    <div className={`p-2 sm:p-4 border-t border-border bg-card ${isThreadReply ? 'rounded-b-lg' : ''}`}>
      <div className="space-y-2">
        {/* File Upload Component */}
        <FileUpload
          ref={fileUploadRef}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
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