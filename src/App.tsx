import { useState, useEffect, useRef } from 'react'
import { UserInfo, FileAttachment } from '@/types'
import { useSlackData } from '@/hooks/useSlackData'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSettings } from '@/hooks/useSettings'
import { useUserStatus } from '@/hooks/useUserStatus'
import { useNotifications } from '@/hooks/useNotifications'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MessagesView } from '@/components/MessagesView'
import { MessageInput } from '@/components/MessageInput'
import { ThreadView } from '@/components/ThreadView'
import { QuickSwitcher } from '@/components/QuickSwitcher'
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp'
import { Toaster } from '@/components/ui/sonner'

// View states for the app
type ViewState = 'channel' | 'search'

function App() {
  // Initialize settings hook to apply theme on mount
  useSettings()
  
  // Centralized status management
  const { status: userStatus, setStatus: setUserStatus } = useUserStatus()
  
  const {
    user,
    currentChannel,
    setCurrentChannel,
    messages,
    channels,
    lastReadTimestamps,
    sendMessage,
    createChannel,
    updateChannel,
    deleteChannel,
    addReaction,
    markChannelAsRead,
    editMessage,
    deleteMessage
  } = useSlackData()
  
  // Initialize notifications system
  useNotifications(user, channels || [], messages || [])

  const [messageInput, setMessageInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openEmojiPickers, setOpenEmojiPickers] = useState<Set<string>>(new Set())
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewState, setViewState] = useState<ViewState>('channel')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  
  const messageInputRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Set initial channel when channels are loaded
  useEffect(() => {
    if (channels && channels.length > 0 && !currentChannel) {
      const generalChannel = channels.find(c => c.id === 'general') || channels[0]
      if (generalChannel) {
        setCurrentChannel(generalChannel.id)
      }
    }
  }, [channels, currentChannel, setCurrentChannel])

  // Mark current channel as read when it changes
  useEffect(() => {
    if (currentChannel) {
      markChannelAsRead(currentChannel)
    }
  }, [currentChannel, markChannelAsRead])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleChannelSelect = (channelId: string) => {
    setCurrentChannel(channelId)
    setSidebarOpen(false)
    setSearchQuery('')
    setViewState('channel')
    setActiveThreadId(null) // Close any open thread
  }

  const handleChannelCreate = (name: string) => {
    const channelId = createChannel(name)
    setCurrentChannel(channelId)
    setSidebarOpen(false) // Close sidebar on mobile when new channel is created
  }

  const handleChannelDelete = (channelId: string) => {
    deleteChannel(channelId)
    // If we're deleting the current channel, navigate to general
    if (channelId === currentChannel) {
      const generalChannel = channels?.find(c => c.id === 'general') || channels?.[0]
      if (generalChannel) {
        setCurrentChannel(generalChannel.id)
      }
    }
  }

  const handleSendMessage = (attachments?: FileAttachment[]) => {
    if (currentChannel) {
      sendMessage(messageInput, currentChannel, undefined, attachments)
      setMessageInput('')
    }
  }

  const handleSendThreadReply = (content: string, threadId: string, attachments?: FileAttachment[]) => {
    if (currentChannel) {
      sendMessage(content, currentChannel, threadId, attachments)
    }
  }

  const handleStartThread = (messageId: string) => {
    setActiveThreadId(messageId)
  }

  const handleCloseThread = () => {
    setActiveThreadId(null)
  }

  const handleEmojiPickerToggle = (messageId: string, open: boolean) => {
    setOpenEmojiPickers(prev => {
      const newSet = new Set(prev)
      if (open) {
        newSet.add(messageId)
      } else {
        newSet.delete(messageId)
      }
      return newSet
    })
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (query.length >= 2) {
      setViewState('search')
    } else if (query.length === 0) {
      setViewState('channel')
    }
  }

  const handleSearchMessageClick = (messageId: string) => {
    // Find the channel for this message
    const message = Array.isArray(messages) ? messages.find(m => m.id === messageId) : null
    if (message) {
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
    }
  }

  // Keyboard shortcut handlers
  const handleQuickSwitcher = () => {
    setShowQuickSwitcher(true)
  }

  const handleNextChannel = () => {
    if (!channels || !currentChannel) return
    const currentIndex = channels.findIndex(c => c.id === currentChannel)
    const nextIndex = (currentIndex + 1) % channels.length
    setCurrentChannel(channels[nextIndex].id)
  }

  const handlePrevChannel = () => {
    if (!channels || !currentChannel) return
    const currentIndex = channels.findIndex(c => c.id === currentChannel)
    const prevIndex = currentIndex === 0 ? channels.length - 1 : currentIndex - 1
    setCurrentChannel(channels[prevIndex].id)
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleFocusInput = () => {
    if (viewState === 'channel') {
      messageInputRef.current?.focus()
    }
  }

  const handleFocusSearch = () => {
    searchInputRef.current?.focus()
  }

  const handleAddReaction = () => {
    // Get current messages for the active view
    const currentMessages = viewState === 'search' 
      ? (Array.isArray(messages) ? messages.filter(message => 
          message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.userName.toLowerCase().includes(searchQuery.toLowerCase())
        ) : [])
      : (Array.isArray(messages) ? messages.filter(message => message.channelId === currentChannel) : [])
    
    if (!currentMessages.length) return
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage) {
      handleEmojiPickerToggle(lastMessage.id, true)
    }
  }

  const handleStartThreadOnLastMessage = () => {
    // Get current messages for the active view
    const currentMessages = viewState === 'search' 
      ? (Array.isArray(messages) ? messages.filter(message => 
          message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.userName.toLowerCase().includes(searchQuery.toLowerCase())
        ) : [])
      : (Array.isArray(messages) ? messages.filter(message => message.channelId === currentChannel) : [])
    
    if (!currentMessages.length) return
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage && !lastMessage.threadId) {
      handleStartThread(lastMessage.id)
    }
  }

  const handleEscape = () => {
    if (showQuickSwitcher) {
      setShowQuickSwitcher(false)
    } else if (showKeyboardHelp) {
      setShowKeyboardHelp(false)
    } else if (activeThreadId) {
      setActiveThreadId(null)
    } else if (openEmojiPickers.size > 0) {
      setOpenEmojiPickers(new Set())
    } else if (showInputEmojiPicker) {
      setShowInputEmojiPicker(false)
    } else if (searchQuery) {
      setSearchQuery('')
      setViewState('channel')
    }
  }

  const handleEditLastMessage = () => {
    if (!user) return
    
    // Get current messages for the active view
    const currentMessages = viewState === 'search' 
      ? (Array.isArray(messages) ? messages.filter(message => 
          message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.userName.toLowerCase().includes(searchQuery.toLowerCase())
        ) : [])
      : (Array.isArray(messages) ? messages.filter(message => message.channelId === currentChannel) : [])
    
    // Find the last message by this user
    const userMessages = currentMessages.filter(msg => msg.userId === user.id)
    if (userMessages.length === 0) return
    
    const lastMessage = userMessages[userMessages.length - 1]
    // For now, we'll just focus on the message. In a real implementation,
    // we could trigger the edit mode directly on the MessageItem
    if (lastMessage) {
      const messageElement = document.getElementById(`message-${lastMessage.id}`)
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Find the edit button and click it
        const editButton = messageElement.querySelector('[data-edit-button]') as HTMLButtonElement
        if (editButton) {
          editButton.click()
        }
      }
    }
  }

  const handleShowHelp = () => {
    setShowKeyboardHelp(true)
  }

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onQuickSwitcher: handleQuickSwitcher,
    onNextChannel: handleNextChannel,
    onPrevChannel: handlePrevChannel,
    onToggleSidebar: handleToggleSidebar,
    onFocusInput: handleFocusInput,
    onSendMessage: handleSendMessage,
    onAddReaction: handleAddReaction,
    onStartThread: handleStartThreadOnLastMessage,
    onSearch: handleFocusSearch,
    onEscape: handleEscape,
    onHelp: handleShowHelp,
    onEditLastMessage: handleEditLastMessage,
  })

  if (!user || !channels) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Filter messages for current view
  const currentMessages = viewState === 'search' 
    ? (Array.isArray(messages) ? messages.filter(message => 
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.userName.toLowerCase().includes(searchQuery.toLowerCase())
      ) : [])
    : (Array.isArray(messages) ? messages.filter(message => message.channelId === currentChannel) : [])

  // Get thread data
  const activeThread = activeThreadId ? (Array.isArray(messages) ? messages.find(m => m.id === activeThreadId) : null) : null
  const threadMessages = activeThreadId ? (Array.isArray(messages) ? messages.filter(m => m.threadId === activeThreadId) : []) : []

  return (
    <div className="flex h-screen bg-background relative">
      <Sidebar
        user={user}
        channels={channels || []}
        currentChannel={currentChannel}
        messages={messages || []}
        lastReadTimestamps={lastReadTimestamps}
        sidebarOpen={sidebarOpen}
        userStatus={userStatus}
        onChannelSelect={handleChannelSelect}
        onChannelCreate={handleChannelCreate}
        onChannelUpdate={updateChannel}
        onChannelDelete={handleChannelDelete}
        onSidebarToggle={setSidebarOpen}
        onStatusChange={setUserStatus}
        onShowKeyboardShortcuts={() => setShowKeyboardHelp(true)}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header
          channels={channels || []}
          currentChannel={currentChannel}
          searchQuery={searchQuery}
          onSidebarToggle={() => setSidebarOpen(true)}
          onSearchChange={handleSearchChange}
          searchInputRef={searchInputRef}
        />

        {/* Messages Area */}
        <MessagesView
          messages={currentMessages}
          channels={channels || []}
          user={user}
          userStatus={userStatus}
          openEmojiPickers={openEmojiPickers}
          onEmojiPickerToggle={handleEmojiPickerToggle}
          onReactionAdd={addReaction}
          onMessageClick={viewState === 'search' ? handleSearchMessageClick : undefined}
          onStartThread={handleStartThread}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          searchQuery={viewState === 'search' ? searchQuery : ''}
        />

        {/* Message Input - Only show for channel view */}
        {viewState === 'channel' && (
          <MessageInput
            ref={messageInputRef}
            user={user}
            messageInput={messageInput}
            showInputEmojiPicker={showInputEmojiPicker}
            onMessageInput={setMessageInput}
            onInputEmojiPickerToggle={setShowInputEmojiPicker}
            onSendMessage={handleSendMessage}
            currentChannel={currentChannel}
            channels={channels || []}
          />
        )}
      </div>

      {/* Thread View Modal */}
      {activeThread && (
        <ThreadView
          parentMessage={activeThread}
          threadMessages={threadMessages}
          user={user}
          channels={channels || []}
          userStatus={userStatus}
          openEmojiPickers={openEmojiPickers}
          onClose={handleCloseThread}
          onEmojiPickerToggle={handleEmojiPickerToggle}
          onReactionAdd={addReaction}
          onSendThreadReply={handleSendThreadReply}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
        />
      )}

      {/* Quick Switcher Modal */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
        channels={channels || []}
        currentChannel={currentChannel}
        onChannelSelect={handleChannelSelect}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App