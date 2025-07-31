import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Message, FileAttachment } from '@/types'
import { MESSAGE_CONFIG, FILE_TYPES } from '@/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parses JSON with fallback value
 */
export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Validates file attachment before upload
 */
export function validateFileAttachment(file: File): { valid: boolean; error?: string } {
  if (file.size > MESSAGE_CONFIG.maxAttachmentSize) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MESSAGE_CONFIG.maxAttachmentSize / (1024 * 1024)}MB.`
    }
  }
  
  return { valid: true }
}

/**
 * Gets file type category for icons and handling
 */
export function getFileTypeCategory(fileName: string): keyof typeof FILE_TYPES | 'other' {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) return 'other'
  
  for (const [category, extensions] of Object.entries(FILE_TYPES)) {
    if ((extensions as readonly string[]).includes(extension)) {
      return category as keyof typeof FILE_TYPES
    }
  }
  
  return 'other'
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Safely scrolls an element into view
 */
export function safeScrollIntoView(
  element: Element | null,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
): void {
  if (element && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView(options)
  }
}

/**
 * Formats a timestamp into a human-readable time string
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

/**
 * Formats a timestamp into a human-readable date string
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }
}

/**
 * Get username from messages array or return userId as fallback
 */
export const getUserName = (userId: string, messages: any[]): string => {
  if (!messages || !Array.isArray(messages)) return userId
  const userMessage = messages.find(msg => msg.userId === userId)
  return userMessage?.userName || userId
}

/**
 * Count unread messages for a specific channel
 */
export const getChannelUnreadCount = (channelId: string, messages: any[], lastReadTimestamps: Record<string, number>): number => {
  if (!messages || !Array.isArray(messages)) return 0
  const lastReadTime = lastReadTimestamps[channelId] || 0
  return messages.filter(msg => msg.channelId === channelId && msg.timestamp > lastReadTime).length
}

/**
 * Count messages for a specific channel (legacy - keeping for compatibility)
 */
export const getChannelMessageCount = (channelId: string, messages: any[]): number => {
  if (!messages || !Array.isArray(messages)) return 0
  return messages.filter(msg => msg.channelId === channelId).length
}

/**
 * Convert HTML content to plain text for storage
 */
export const getPlainTextFromHTML = (html: string): string => {
  try {
    if (!html || html.trim() === '') return ''
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Convert HTML formatting back to markdown-like syntax
    let text = tempDiv.innerHTML
    
    // Convert HTML tags back to markdown
    text = text.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    text = text.replace(/<em>(.*?)<\/em>/g, '*$1*')
    text = text.replace(/<del>(.*?)<\/del>/g, '~~$1~~')
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1')
    text = text.replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
    text = text.replace(/<pre[^>]*>(.*?)<\/pre>/g, '```\n$1\n```')
    text = text.replace(/<br\s*\/?>/g, '\n')
    text = text.replace(/<div>/g, '\n')
    text = text.replace(/<\/div>/g, '')
    
    // Clean up any remaining HTML tags
    const cleanDiv = document.createElement('div')
    cleanDiv.innerHTML = text
    return cleanDiv.textContent || cleanDiv.innerText || ''
  } catch (error) {
    console.error('Error processing HTML:', error)
    // Fallback to just getting text content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  }
}

// Search utility functions
export function searchMessages(messages: Message[], query: string): Message[] {
  if (!messages || !Array.isArray(messages) || !query || !query.trim()) return messages || []
  
  const searchTerm = query.toLowerCase().trim()
  
  return messages.filter(message => {
    // Search in message content (plain text extraction from HTML)
    const plainTextContent = stripHtml(message.content).toLowerCase()
    
    // Search in user name
    const userName = message.userName.toLowerCase()
    
    // Also search in formatted content for better matching
    const formattedContent = message.content.toLowerCase()
    
    return plainTextContent.includes(searchTerm) || 
           userName.includes(searchTerm) ||
           formattedContent.includes(searchTerm)
  })
}

export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm || !searchTerm.trim()) return text
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
  return text.replace(regex, '<mark class="bg-accent/20 text-accent-foreground px-0.5 rounded font-medium">$1</mark>')
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
