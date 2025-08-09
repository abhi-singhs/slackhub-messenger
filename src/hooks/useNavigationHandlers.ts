import { useCallback, useEffect } from 'react'
import { FileAttachment, Channel, UserInfo } from '@/types'

interface NavigationHandlersProps {
  currentChannel: string | null
  setCurrentChannel: (channelId: string) => void
  channels: Channel[] | null
  sendMessage: (content: string, channelId?: string, threadId?: string, attachments?: FileAttachment[]) => void
  createChannel: (name: string) => Promise<string>
  deleteChannel: (channelId: string) => void
  markChannelAsRead: (channelId: string) => void
  
  // State setters
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setSearchQuery: (query: string) => void
  setViewState: (state: 'channel' | 'search') => void
  setActiveThreadId: (id: string | null) => void
}

interface NavigationHandlersReturn {
  handleChannelSelect: (channelId: string) => void
  handleChannelCreate: (name: string) => Promise<void>
  handleChannelDelete: (channelId: string) => void
  handleSendMessage: (messageInput: string, attachments?: FileAttachment[]) => void
  handleSendThreadReply: (content: string, threadId: string, attachments?: FileAttachment[]) => void
  handleStartThread: (messageId: string) => void
  handleCloseThread: () => void
  handleToggleSidebar: () => void
  handleNextChannel: () => void
  handlePrevChannel: () => void
}

/**
 * Custom hook for handling navigation and channel operations
 * Centralizes all navigation-related logic and channel management
 */
export function useNavigationHandlers({
  currentChannel,
  setCurrentChannel,
  channels,
  sendMessage,
  createChannel,
  deleteChannel,
  markChannelAsRead,
  setSidebarOpen,
  setSearchQuery,
  setViewState,
  setActiveThreadId
}: NavigationHandlersProps): NavigationHandlersReturn {
  
  // Mark current channel as read when it changes
  useEffect(() => {
    if (currentChannel) {
      markChannelAsRead(currentChannel)
    }
  }, [currentChannel, markChannelAsRead])

  const handleChannelSelect = useCallback((channelId: string) => {
    setCurrentChannel(channelId)
    setSidebarOpen(false)
    setSearchQuery('')
    setViewState('channel')
    setActiveThreadId(null)
  }, [setCurrentChannel, setSidebarOpen, setSearchQuery, setViewState, setActiveThreadId])

  const handleChannelCreate = useCallback(async (name: string) => {
    const channelId = await createChannel(name)
    if (channelId) {
      setCurrentChannel(channelId)
    }
    setSidebarOpen(false)
  }, [createChannel, setCurrentChannel, setSidebarOpen])

  const handleChannelDelete = useCallback((channelId: string) => {
    deleteChannel(channelId)
    
    // If we're deleting the current channel, navigate to general or first available
    if (channelId === currentChannel) {
      const generalChannel = channels?.find(c => c.id === 'general') || channels?.[0]
      if (generalChannel) {
        setCurrentChannel(generalChannel.id)
      }
    }
  }, [deleteChannel, currentChannel, channels, setCurrentChannel])

  const handleSendMessage = useCallback((messageInput: string, attachments?: FileAttachment[]) => {
    const hasText = !!messageInput?.trim()
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0
    if (currentChannel && (hasText || hasAttachments)) {
      sendMessage(messageInput, currentChannel, undefined, attachments)
    }
  }, [currentChannel, sendMessage])

  const handleSendThreadReply = useCallback((content: string, threadId: string, attachments?: FileAttachment[]) => {
    const hasText = !!content?.trim()
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0
    if (currentChannel && (hasText || hasAttachments)) {
      sendMessage(content, currentChannel, threadId, attachments)
    }
  }, [currentChannel, sendMessage])

  const handleStartThread = useCallback((messageId: string) => {
    setActiveThreadId(messageId)
  }, [setActiveThreadId])

  const handleCloseThread = useCallback(() => {
    setActiveThreadId(null)
  }, [setActiveThreadId])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [setSidebarOpen])

  const handleNextChannel = useCallback(() => {
    if (!channels || !currentChannel) return
    
    const currentIndex = channels.findIndex(c => c.id === currentChannel)
    const nextIndex = (currentIndex + 1) % channels.length
    setCurrentChannel(channels[nextIndex].id)
  }, [channels, currentChannel, setCurrentChannel])

  const handlePrevChannel = useCallback(() => {
    if (!channels || !currentChannel) return
    
    const currentIndex = channels.findIndex(c => c.id === currentChannel)
    const prevIndex = currentIndex === 0 ? channels.length - 1 : currentIndex - 1
    setCurrentChannel(channels[prevIndex].id)
  }, [channels, currentChannel, setCurrentChannel])

  return {
    handleChannelSelect,
    handleChannelCreate,
    handleChannelDelete,
    handleSendMessage,
    handleSendThreadReply,
    handleStartThread,
    handleCloseThread,
    handleToggleSidebar,
    handleNextChannel,
    handlePrevChannel
  }
}
