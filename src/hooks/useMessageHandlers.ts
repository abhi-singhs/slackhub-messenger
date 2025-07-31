import { useCallback } from 'react'
import { Message, UserInfo } from '@/types'

interface MessageHandlersProps {
  messages: Message[] | null
  currentChannel: string | null
  user: UserInfo | null
  searchQuery: string
  viewState: 'channel' | 'search'
  
  // Operations
  addReaction: (messageId: string, emoji: string) => void
  editMessage: (messageId: string, content: string) => void
  
  // State setters
  setCurrentChannel: (channelId: string) => void
  setViewState: (state: 'channel' | 'search') => void
  setSearchQuery: (query: string) => void
  setActiveThreadId: (id: string | null) => void
  handleEmojiPickerToggle: (messageId: string, open: boolean) => void
}

interface MessageHandlersReturn {
  handleSearchMessageClick: (messageId: string) => void
  handleAddReaction: () => void
  handleStartThreadOnLastMessage: () => void
  handleEditLastMessage: () => void
  getCurrentMessages: () => Message[]
}

/**
 * Custom hook for handling message-related operations
 * Centralizes message interaction logic including search, reactions, and editing
 */
export function useMessageHandlers({
  messages,
  currentChannel,
  user,
  searchQuery,
  viewState,
  addReaction,
  editMessage,
  setCurrentChannel,
  setViewState,
  setSearchQuery,
  setActiveThreadId,
  handleEmojiPickerToggle
}: MessageHandlersProps): MessageHandlersReturn {
  
  const getCurrentMessages = useCallback((): Message[] => {
    if (!Array.isArray(messages)) return []
    
    return viewState === 'search' 
      ? messages.filter(message => 
          message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.userName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages.filter(message => message.channelId === currentChannel)
  }, [messages, viewState, searchQuery, currentChannel])

  const handleSearchMessageClick = useCallback((messageId: string) => {
    if (!Array.isArray(messages)) return
    
    // Find the channel for this message
    const message = messages.find(m => m.id === messageId)
    if (!message) return
    
    setCurrentChannel(message.channelId)
    setViewState('channel')
    setSearchQuery('')
    
    // Scroll to the message after a brief delay
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`)
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        messageElement.classList.add('animate-pulse')
        setTimeout(() => {
          messageElement.classList.remove('animate-pulse')
        }, 2000)
      }
    }, 100)
  }, [messages, setCurrentChannel, setViewState, setSearchQuery])

  const handleAddReaction = useCallback(() => {
    const currentMessages = getCurrentMessages()
    if (!currentMessages.length) return
    
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage) {
      handleEmojiPickerToggle(lastMessage.id, true)
    }
  }, [getCurrentMessages, handleEmojiPickerToggle])

  const handleStartThreadOnLastMessage = useCallback(() => {
    const currentMessages = getCurrentMessages()
    if (!currentMessages.length) return
    
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage && !lastMessage.threadId) {
      setActiveThreadId(lastMessage.id)
    }
  }, [getCurrentMessages, setActiveThreadId])

  const handleEditLastMessage = useCallback(() => {
    if (!user) return
    
    const currentMessages = getCurrentMessages()
    
    // Find the last message by this user
    const userMessages = currentMessages.filter(msg => msg.userId === user.id)
    if (userMessages.length === 0) return
    
    const lastMessage = userMessages[userMessages.length - 1]
    if (lastMessage) {
      // Trigger edit mode for the message
      // This would typically involve setting edit state in the message component
      console.log('Edit last message:', lastMessage.id)
      // You might want to emit an event or call a callback here
    }
  }, [user, getCurrentMessages])

  return {
    handleSearchMessageClick,
    handleAddReaction,
    handleStartThreadOnLastMessage,
    handleEditLastMessage,
    getCurrentMessages
  }
}
