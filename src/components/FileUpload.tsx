import { useState, useRef } from 'react'
import { FileAttachment } from '@/types'
import { createFileAttachment, getAllowedFileTypes, formatFileSize, MAX_FILE_SIZE } from '@/lib/fileUtils'
import { Button } from '@/components/ui/button'
import { FileAttachmentView } from '@/components/FileAttachmentView'
import { Paperclip, X, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FileUploadProps {
  attachments: FileAttachment[]
  onAttachmentsChange: (attachments: FileAttachment[]) => void
  disabled?: boolean
}

export function FileUpload({ attachments, onAttachmentsChange, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newAttachments: FileAttachment[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const attachment = await createFileAttachment(file)
          newAttachments.push(attachment)
        } catch (error) {
          console.error('Error processing file:', error)
          toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments])
        toast.success(`${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''} uploaded`)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const removeAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== attachmentId))
  }

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-2">
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-muted/30">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative group">
              <FileAttachmentView attachment={attachment} className="max-w-32" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeAttachment(attachment.id)}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className={`relative ${isDragOver ? 'bg-accent/10 border-accent' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAllowedFileTypes()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openFileDialog}
          disabled={disabled || isUploading}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
          ) : (
            <Paperclip size={16} />
          )}
        </Button>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/10 border-2 border-dashed border-accent rounded-lg pointer-events-none">
            <div className="text-center text-accent">
              <Upload size={24} className="mx-auto mb-2" />
              <p className="text-sm font-medium">Drop files here</p>
              <p className="text-xs">Max {formatFileSize(MAX_FILE_SIZE)} per file</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}