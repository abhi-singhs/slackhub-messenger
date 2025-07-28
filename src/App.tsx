import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { UserInfo } from '@/types'
import { useSlackData } from '@/hooks/useSlackData'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ChannelView, SearchView } from '@/routes'

// Main app content component that handles routing
function AppContent() {
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

  const navigate = useNavigate()
  const { channelId } = useParams<{ channelId: string }>()
  const [searchParams] = useSearchParams()
  const targetMessageId = searchParams.get('message')

  // Sync current channel with URL parameter
  useEffect(() => {
    if (channelId && channelId !== currentChannel) {
      setCurrentChannel(channelId)
    }
  }, [channelId, currentChannel, setCurrentChannel])

  // Handle initial navigation when channels are loaded
  useEffect(() => {
    // Only navigate if:
    // 1. We have channels loaded
    // 2. We're not already on a channel route (no channelId in URL)
    // 3. We haven't already navigated
    if (channels && channels.length > 0 && !channelId) {
      const generalChannel = channels.find(c => c.id === 'general') || channels[0]
      if (generalChannel) {
        navigate(`/channel/${generalChannel.id}`, { replace: true })
      }
    }
  }, [channels, channelId, navigate])

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

  // Scroll to target message when URL contains message parameter
  useEffect(() => {
    if (targetMessageId) {
      setTimeout(() => {
        const messageElement = document.getElementById(`message-${targetMessageId}`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          messageElement.classList.add('animate-pulse')
          setTimeout(() => {
            messageElement.classList.remove('animate-pulse')
          }, 2000)
        }
      }, 100)
    }
  }, [targetMessageId])

  const handleChannelSelect = (channelId: string) => {
    // Navigate directly to the channel
    navigate(`/channel/${channelId}`)
    setSidebarOpen(false)
    setSearchQuery('')
  }

  const handleChannelCreate = (name: string) => {
    const channelId = createChannel(name)
    setSidebarOpen(false) // Close sidebar on mobile when new channel is created
    navigate(`/channel/${channelId}`)
  }

  const handleChannelDelete = (channelId: string) => {
    deleteChannel(channelId)
    // If we're deleting the current channel, navigate to general
    if (channelId === currentChannel) {
      navigate('/channel/general')
    }
  }

  const handleSendMessage = () => {
    if (channelId) {
      sendMessage(messageInput, channelId)
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
      navigate(`/search?q=${encodeURIComponent(query)}`)
    } else if (query.length === 0) {
      // If search is cleared, go back to current channel
      if (currentChannel) {
        navigate(`/channel/${currentChannel}`)
      }
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

        <Routes>
          <Route 
            path="/channel/:channelId" 
            element={
              <ChannelView
                user={user}
                channels={channels || []}
                messages={messages || []}
                openEmojiPickers={openEmojiPickers}
                showInputEmojiPicker={showInputEmojiPicker}
                messageInput={messageInput}
                onMessageInput={setMessageInput}
                onEmojiPickerToggle={handleEmojiPickerToggle}
                onInputEmojiPickerToggle={setShowInputEmojiPicker}
                onReactionAdd={addReaction}
                onSendMessage={handleSendMessage}
                targetMessageId={targetMessageId}
              />
            } 
          />
          <Route 
            path="/search" 
            element={
              <SearchView
                messages={messages || []}
                channels={channels || []}
                user={user}
                openEmojiPickers={openEmojiPickers}
                onEmojiPickerToggle={handleEmojiPickerToggle}
                onReactionAdd={addReaction}
              />
            } 
          />
          <Route 
            path="/" 
            element={
              channels && channels.length > 0 
                ? <Navigate to="/channel/general" replace />
                : <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading channels...</p>
                    </div>
                  </div>
            } 
          />
          <Route path="*" element={<Navigate to="/channel/general" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App