import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Message } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Search utility functions
export function searchMessages(messages: Message[], query: string): Message[] {
  if (!messages || !Array.isArray(messages) || !query.trim()) return messages || []
  
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
  if (!searchTerm.trim()) return text
  
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
