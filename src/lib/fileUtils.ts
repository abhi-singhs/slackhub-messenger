import { FileAttachment } from '@/types'

export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
  documents: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(type: string): string {
  if (SUPPORTED_FILE_TYPES.images.includes(type)) return '🖼️'
  if (SUPPORTED_FILE_TYPES.videos.includes(type)) return '🎥'
  if (SUPPORTED_FILE_TYPES.audio.includes(type)) return '🎵'
  if (SUPPORTED_FILE_TYPES.documents.includes(type)) return '📄'
  if (SUPPORTED_FILE_TYPES.archives.includes(type)) return '📦'
  return '📎'
}

export function isImageFile(type: string): boolean {
  return SUPPORTED_FILE_TYPES.images.includes(type)
}

export function isVideoFile(type: string): boolean {
  return SUPPORTED_FILE_TYPES.videos.includes(type)
}

export function isAudioFile(type: string): boolean {
  return SUPPORTED_FILE_TYPES.audio.includes(type)
}

export function getAllowedFileTypes(): string {
  return Object.values(SUPPORTED_FILE_TYPES).flat().join(',')
}

export async function createFileAttachment(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`))
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const url = e.target?.result as string
      let thumbnail: string | undefined

      // Create thumbnail for images
      if (isImageFile(file.type)) {
        thumbnail = await createImageThumbnail(url)
      }
      // For videos, we could create a thumbnail but it's more complex
      // For now, we'll use the video file itself

      const attachment: FileAttachment = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        thumbnail
      }

      resolve(attachment)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

async function createImageThumbnail(imageUrl: string, maxSize: number = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve(imageUrl) // Fallback to original
        return
      }

      // Calculate thumbnail dimensions
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and get thumbnail
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    img.onerror = () => {
      resolve(imageUrl) // Fallback to original
    }

    img.src = imageUrl
  })
}