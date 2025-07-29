import { FileAttachment } from '@/types'
import { formatFileSize, getFileIcon, isImageFile, isVideoFile, isAudioFile } from '@/lib/fileUtils'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, Play } from '@phosphor-icons/react'
import { useState } from 'react'

interface FileAttachmentViewProps {
  attachment: FileAttachment
  className?: string
}

export function FileAttachmentView({ attachment, className = '' }: FileAttachmentViewProps) {
  const [showFullImage, setShowFullImage] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = () => {
    if (isImageFile(attachment.type)) {
      setShowFullImage(true)
    } else {
      // Open in new tab for other file types
      window.open(attachment.url, '_blank')
    }
  }

  // Image attachment
  if (isImageFile(attachment.type)) {
    return (
      <div className={`inline-block ${className}`}>
        <div className="relative group max-w-sm">
          <img
            src={attachment.thumbnail || attachment.url}
            alt={attachment.name}
            className="rounded-lg border border-border max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleView}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleView}
                className="bg-background/90 hover:bg-background"
              >
                <ExternalLink size={14} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                className="bg-background/90 hover:bg-background"
              >
                <Download size={14} />
              </Button>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {attachment.name} • {formatFileSize(attachment.size)}
        </div>

        {/* Full image modal */}
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-full max-h-full">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                className="absolute top-4 right-4 bg-background/90 hover:bg-background"
                size="sm"
                onClick={() => setShowFullImage(false)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Video attachment
  if (isVideoFile(attachment.type)) {
    return (
      <div className={`inline-block max-w-sm ${className}`}>
        <div className="relative group">
          <video
            src={attachment.url}
            controls
            className="rounded-lg border border-border max-h-64 w-full"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {attachment.name} • {formatFileSize(attachment.size)}
        </div>
      </div>
    )
  }

  // Audio attachment
  if (isAudioFile(attachment.type)) {
    return (
      <div className={`inline-block ${className}`}>
        <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30 max-w-md">
          <div className="text-2xl">🎵</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{attachment.name}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
            <audio
              src={attachment.url}
              controls
              className="mt-2 w-full h-8"
              preload="metadata"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      </div>
    )
  }

  // Generic file attachment
  return (
    <div className={`inline-block ${className}`}>
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors max-w-sm">
        <div className="text-2xl">{getFileIcon(attachment.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{attachment.name}</div>
          <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleView}
            className="h-8 w-8 p-0"
          >
            <ExternalLink size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}