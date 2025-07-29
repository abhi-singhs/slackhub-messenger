import { useState, useEffect } from 'react'
import { UserInfo } from '@/types'
import { useSlackData } from '@/hooks/useSlackData'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MessagesView } from '@/components/MessagesView'
import { MessageInput } from '@/components/MessageInput'

// View states for the app
type ViewState = 'channel' | 'search'

function App() {
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
    markChannelAsRead
  } = useSlackData()

  const [messageInput, setMessageInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openEmojiPickers, setOpenEmojiPickers] = useState<Set<string>>(new Set())
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewState, setViewState] = useState<ViewState>('channel')

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

  const handleSendMessage = () => {
    if (currentChannel) {
      sendMessage(messageInput, currentChannel)
      setMessageInput('')
    }
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
    const message = messages?.find(m => m.id === messageId)
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

  if (!user || !channels) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Filter messages for current view
  const currentMessages = viewState === 'search' 
    ? (messages?.filter(message => 
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.userName.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [])
    : (messages?.filter(message => message.channelId === currentChannel) || [])

  return (
    <div className="flex h-screen bg-background relative">
      <Sidebar
        user={user}
        channels={channels || []}
        currentChannel={currentChannel}
        messages={messages || []}
        lastReadTimestamps={lastReadTimestamps}
        sidebarOpen={sidebarOpen}
        onChannelSelect={handleChannelSelect}
        onChannelCreate={handleChannelCreate}
        onChannelUpdate={updateChannel}
        onChannelDelete={handleChannelDelete}
        onSidebarToggle={setSidebarOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header
          channels={channels || []}
          currentChannel={currentChannel}
          searchQuery={searchQuery}
          onSidebarToggle={() => setSidebarOpen(true)}
          onSearchChange={handleSearchChange}
        />

        {/* Messages Area */}
        <MessagesView
          messages={currentMessages}
          channels={channels || []}
          user={user}
          openEmojiPickers={openEmojiPickers}
          onEmojiPickerToggle={handleEmojiPickerToggle}
          onReactionAdd={addReaction}
          onMessageClick={viewState === 'search' ? handleSearchMessageClick : undefined}
          searchQuery={viewState === 'search' ? searchQuery : ''}
        />

        {/* Message Input - Only show for channel view */}
        {viewState === 'channel' && (
          <MessageInput
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
    </div>
  );
}

export default App