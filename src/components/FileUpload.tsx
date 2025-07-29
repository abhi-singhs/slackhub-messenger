import { useState, useRef, useEffect } from 'react'
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
  onFileUploadClick?: (callback: () => void) => void
}

export function FileUpload({ attachments, onAttachmentsChange, disabled, onFileUploadClick }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Register the file dialog opener with parent
  useEffect(() => {
    if (onFileUploadClick) {
      onFileUploadClick(openFileDialog)
    }
  }, [onFileUploadClick])

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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only hide if we're leaving the window or container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
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

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAllowedFileTypes()}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

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

      {/* Drag and drop area (only visible when dragging) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
          <div 
            className="bg-card border-2 border-dashed border-accent rounded-lg p-8 text-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={48} className="mx-auto mb-4 text-accent" />
            <p className="text-lg font-medium text-foreground mb-2">Drop files here</p>
            <p className="text-sm text-muted-foreground">Max {formatFileSize(MAX_FILE_SIZE)} per file</p>
          </div>
        </div>
      )}
    </div>
  )
}