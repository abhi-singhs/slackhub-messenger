import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Message } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
