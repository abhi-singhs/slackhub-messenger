import { FileAttachment, CallParticipant, UserStatus } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings'
import { useSupabaseUserStatus } from '@/hooks/useSupabaseUserStatus'
import { useSupabasePresence } from '@/hooks/useSupabasePresence'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { useNotifications } from '@/hooks/useNotifications'
import { useSupabaseCalls } from '@/hooks/useSupabaseCalls'
import { useAppState } from '@/hooks/useAppState'
import { useNavigationHandlers } from '@/hooks/useNavigationHandlers'
import { useMessageHandlers } from '@/hooks/useMessageHandlers'
import { useAppKeyboardShortcuts } from '@/hooks/useAppKeyboardShortcuts'
import { useResponsiveBehavior } from '@/hooks/useResponsiveBehavior'
import { AuthComponent } from '@/components/AuthComponent'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { MessagesView } from '@/components/MessagesView'
import { MessageInput } from '@/components/MessageInput'
import { ThreadView } from '@/components/ThreadView'
import { QuickSwitcher } from '@/components/QuickSwitcher'
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp'
import { CallInterface } from '@/components/CallInterface'
import { IncomingCallDialog } from '@/components/IncomingCallDialog'
import { Toaster } from '@/components/ui/sonner'

function App() {
  // Authentication
  const { user, loading: authLoading, updateUserLocal } = useAuth()
  
  // Initialize settings hook to apply theme on mount  
  const { settings, updateTheme, updateColorTheme, updateNotificationSettings } = useSupabaseSettings(user)
  
  // Centralized status management
  const { status: userStatus, setStatus: setUserStatus } = useSupabaseUserStatus(user, updateUserLocal)
  
  console.log('🏠 App render - user:', user?.login, 'userStatus:', userStatus)
  
  const {
    currentChannel,
    setCurrentChannel,
    messages,
    channels,
    lastReadTimestamps,
    loading: dataLoading,
    sendMessage,
    createChannel,
    updateChannel,
    deleteChannel,
    addReaction,
    markChannelAsRead,
    editMessage,
    deleteMessage
  } = useSupabaseData(user)
  
  // Initialize notifications system
  useNotifications(user, channels || [], messages || [])

  // Initialize calls system
  const {
    currentCall,
    incomingCall,
    isCallUIOpen,
    callHistory,
    callRecordings,
    localStream,
    remoteStream,
    isMuted,
    hasVideo,
    isRecording,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    startRecording,
    stopRecording,
    deleteRecording,
    setIsCallUIOpen
  } = useSupabaseCalls(user)

  // Initialize presence system for realtime user tracking
  const {
    onlineUsers,
    channelPresence,
    updatePresence
  } = useSupabasePresence(user, currentChannel)

  // Initialize realtime notifications
  useRealtimeNotifications({
    user,
    currentChannel,
    channels: channels || [],
    notificationSettings: settings?.notifications
  })

  // App state management
  const {
    messageInput,
    setMessageInput,
    sidebarOpen,
    setSidebarOpen,
    openEmojiPickers,
    setOpenEmojiPickers,
    showInputEmojiPicker,
    setShowInputEmojiPicker,
    searchQuery,
    setSearchQuery,
    viewState,
    setViewState,
    activeThreadId,
    setActiveThreadId,
    showQuickSwitcher,
    setShowQuickSwitcher,
    showKeyboardHelp,
    setShowKeyboardHelp,
    messageInputRef,
    searchInputRef,
    handleEmojiPickerToggle,
    handleSearchChange,
    handleEscape
  } = useAppState()

  // Navigation handlers
  const {
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
  } = useNavigationHandlers({
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
  })

  // Message handlers
  const {
    handleSearchMessageClick,
    handleAddReaction,
    handleStartThreadOnLastMessage,
    handleEditLastMessage
  } = useMessageHandlers({
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
  })

  // Responsive behavior
  useResponsiveBehavior({ setSidebarOpen })

  // Custom status change handler that updates both user status and presence
  const handleStatusChange = async (newStatus: UserStatus) => {
    console.log('🔄 Handling status change:', newStatus)
    setUserStatus(newStatus)
    await updatePresence(newStatus)
  }

  // Get current messages for display
  const { getCurrentMessages } = useMessageHandlers({
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
  })

  const currentMessages = getCurrentMessages()

  // Get thread data
  const activeThread = activeThreadId && Array.isArray(messages) 
    ? messages.find(msg => msg.id === activeThreadId) || null
    : null

  const threadMessages = activeThread && Array.isArray(messages)
    ? messages.filter(msg => msg.threadId === activeThread.id)
    : []

  // Keyboard shortcuts handlers
  const keyboardHandlers = useAppKeyboardShortcuts({
    messageInputRef,
    searchInputRef,
    viewState,
    setShowQuickSwitcher,
    setShowKeyboardHelp,
    onQuickSwitcher: () => setShowQuickSwitcher(true),
    onNextChannel: handleNextChannel,
    onPrevChannel: handlePrevChannel,
    onToggleSidebar: handleToggleSidebar,
    onAddReaction: handleAddReaction,
    onStartThreadOnLastMessage: handleStartThreadOnLastMessage,
    onEscape: handleEscape,
    onEditLastMessage: handleEditLastMessage
  })

  const handleStartCall = (type: 'voice' | 'video', participants: CallParticipant[], channelId?: string) => {
    // For now, we'll start a call with the first participant
    // In a real implementation, you might want to handle multiple participants differently
    if (participants.length > 0) {
      startCall(participants[0].userId, type as any) // Cast to match the hook's expected type
    }
  }

  const handleSendMessageWithInput = (attachments?: FileAttachment[]) => {
    handleSendMessage(messageInput, attachments)
    setMessageInput('')
  }

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onQuickSwitcher: keyboardHandlers.handleQuickSwitcher,
    onNextChannel: keyboardHandlers.handleNextChannel,
    onPrevChannel: keyboardHandlers.handlePrevChannel,
    onToggleSidebar: keyboardHandlers.handleToggleSidebar,
    onFocusInput: keyboardHandlers.handleFocusInput,
    onSendMessage: handleSendMessageWithInput,
    onAddReaction: keyboardHandlers.handleAddReaction,
    onStartThread: keyboardHandlers.handleStartThreadOnLastMessage,
    onSearch: keyboardHandlers.handleFocusSearch,
    onEscape: keyboardHandlers.handleEscape,
    onHelp: () => setShowKeyboardHelp(true),
    onEditLastMessage: keyboardHandlers.handleEditLastMessage,
  })

  if (authLoading || !user) {
    return authLoading ? (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    ) : (
      <AuthComponent />
    )
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
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
        userStatus={userStatus}
        onChannelSelect={handleChannelSelect}
        onChannelCreate={handleChannelCreate}
        onChannelUpdate={updateChannel}
        onChannelDelete={handleChannelDelete}
        onSidebarToggle={setSidebarOpen}
        onStatusChange={handleStatusChange}
        onShowKeyboardShortcuts={() => setShowKeyboardHelp(true)}
        settings={settings}
        updateTheme={updateTheme}
        updateColorTheme={updateColorTheme}
        updateNotificationSettings={updateNotificationSettings}
        onlineUsers={onlineUsers}
        channelPresence={channelPresence[currentChannel]}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header
          channels={channels || []}
          currentChannel={currentChannel}
          searchQuery={searchQuery}
          user={user}
          callHistory={callHistory}
          callRecordings={callRecordings}
          onSidebarToggle={() => setSidebarOpen(true)}
          onSearchChange={handleSearchChange}
          onStartCall={handleStartCall}
          onDeleteRecording={deleteRecording}
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
            onEmojiPickerToggle={setShowInputEmojiPicker}
            onSendMessage={handleSendMessageWithInput}
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

      {/* Call Interface */}
      <CallInterface
        currentCall={currentCall}
        user={user}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        hasVideo={hasVideo}
        isRecording={isRecording}
        isOpen={isCallUIOpen}
        onClose={() => setIsCallUIOpen(false)}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {/* Incoming Call Dialog */}
      <IncomingCallDialog
        incomingCall={incomingCall}
        onAnswer={answerCall}
        onDecline={declineCall}
      />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App