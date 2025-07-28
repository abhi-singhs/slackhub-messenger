import { useState, useEffect } from 'react'
import { UserInfo } from '@/types'
import { useSlackData } from '@/hooks/useSlackData'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MessagesList } from '@/components/MessagesList'
import { MessageInput } from '@/components/MessageInput'

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
    setSidebarOpen(false) // Close sidebar on mobile when channel is selected
    setSearchQuery('') // Clear search when switching channels
  }

  const handleChannelCreate = (name: string) => {
    createChannel(name)
    setSidebarOpen(false) // Close sidebar on mobile when new channel is created
  }

  const handleSendMessage = () => {
    sendMessage(messageInput)
    setMessageInput('')
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background relative">
      <Sidebar
        user={user}
        channels={channels}
        currentChannel={currentChannel}
        messages={messages}
        lastReadTimestamps={lastReadTimestamps}
        sidebarOpen={sidebarOpen}
        onChannelSelect={handleChannelSelect}
        onChannelCreate={handleChannelCreate}
        onChannelUpdate={updateChannel}
        onChannelDelete={deleteChannel}
        onSidebarToggle={setSidebarOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header
          channels={channels}
          currentChannel={currentChannel}
          searchQuery={searchQuery}
          onSidebarToggle={() => setSidebarOpen(true)}
          onSearchChange={setSearchQuery}
        />

        <MessagesList
          messages={messages}
          channels={channels}
          currentChannel={currentChannel}
          user={user}
          searchQuery={searchQuery}
          openEmojiPickers={openEmojiPickers}
          onEmojiPickerToggle={handleEmojiPickerToggle}
          onReactionAdd={addReaction}
        />

        <MessageInput
          channels={channels}
          currentChannel={currentChannel}
          messageInput={messageInput}
          showInputEmojiPicker={showInputEmojiPicker}
          onMessageInput={setMessageInput}
          onEmojiPickerToggle={setShowInputEmojiPicker}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App