// Common emoji reactions for the picker
export const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😊', '😂', '😮', '😢', '😡',
  '🎉', '🔥', '👏', '💯', '✅', '❌', '⭐', '🚀'
]

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