import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Hash, PaperPlaneRight, Plus, List, X, Smiley } from '@phosphor-icons/react'

interface Message {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string
  timestamp: number
  channelId: string
  reactions?: MessageReaction[]
}

interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

interface Channel {
  id: string
  name: string
  description?: string
}

interface UserInfo {
  id: string
  login: string
  avatarUrl: string
  email: string
  isOwner: boolean
}

// Common emoji reactions for the picker
const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😊', '😂', '😮', '😢', '😡',
  '🎉', '🔥', '👏', '💯', '✅', '❌', '⭐', '🚀'
]

function App() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [currentChannel, setCurrentChannel] = useState<string>('general')
  const [messageInput, setMessageInput] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [showChannelInput, setShowChannelInput] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openEmojiPickers, setOpenEmojiPickers] = useState<Set<string>>(new Set())
  
  const [messages, setMessages] = useKV<Message[]>('slack-messages', [])
  const [channels, setChannels] = useKV<Channel[]>('slack-channels', [
    { id: 'general', name: 'general', description: 'General discussion' },
    { id: 'random', name: 'random', description: 'Random chatter' },
    { id: 'dev', name: 'dev', description: 'Development talk' }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await spark.user()
        setUser(userData)
      } catch (error) {
        console.log('Using anonymous user')
        setUser({
          id: 'anonymous',
          login: 'Anonymous',
          avatarUrl: '',
          email: '',
          isOwner: false
        })
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentChannel])

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

  const currentChannelMessages = messages.filter(msg => msg.channelId === currentChannel)

  const sendMessage = () => {
    if (!messageInput.trim() || !user) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      userId: user.id,
      userName: user.login,
      userAvatar: user.avatarUrl,
      timestamp: Date.now(),
      channelId: currentChannel
    }

    setMessages((current) => [...current, newMessage])
    setMessageInput('')
  }

  const selectChannel = (channelId: string) => {
    setCurrentChannel(channelId)
    setSidebarOpen(false) // Close sidebar on mobile when channel is selected
  }

  const createChannel = () => {
    if (!newChannelName.trim()) return

    const channelId = newChannelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    setChannels((current) => [
      ...current,
      {
        id: channelId,
        name: newChannelName.trim(),
        description: `${newChannelName.trim()} discussion`
      }
    ])
    
    setNewChannelName('')
    setShowChannelInput(false)
    setCurrentChannel(channelId)
    setSidebarOpen(false) // Close sidebar on mobile when new channel is created
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: 'message' | 'channel') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (action === 'message') {
        sendMessage()
      } else {
        createChannel()
      }
    }
  }

  const formatTime = (timestamp: number) => {
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

  const getUserName = (userId: string) => {
    // Find the username from messages or return userId if not found
    const userMessage = messages.find(msg => msg.userId === userId)
    return userMessage?.userName || userId
  }

  const getChannelMessageCount = (channelId: string) => {
    return messages.filter(msg => msg.channelId === channelId).length
  }

  const addReaction = (messageId: string, emoji: string) => {
    if (!user) return

    setMessages((current) => 
      current.map(message => {
        if (message.id !== messageId) return message

        const reactions = message.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)

        if (existingReaction) {
          // If user already reacted with this emoji, remove their reaction
          if (existingReaction.users.includes(user.id)) {
            const updatedUsers = existingReaction.users.filter(id => id !== user.id)
            if (updatedUsers.length === 0) {
              // Remove the reaction entirely if no users left
              return {
                ...message,
                reactions: reactions.filter(r => r.emoji !== emoji)
              }
            } else {
              // Update the reaction with fewer users
              return {
                ...message,
                reactions: reactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, users: updatedUsers, count: updatedUsers.length }
                    : r
                )
              }
            }
          } else {
            // Add user to existing reaction
            const updatedUsers = [...existingReaction.users, user.id]
            return {
              ...message,
              reactions: reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, users: updatedUsers, count: updatedUsers.length }
                  : r
              )
            }
          }
        } else {
          // Create new reaction
          return {
            ...message,
            reactions: [
              ...reactions,
              {
                emoji,
                users: [user.id],
                count: 1
              }
            ]
          }
        }
      })
    )
  }

  // Emoji Picker Component
  const EmojiPicker = ({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) => (
    <div className="grid grid-cols-8 gap-1 p-2 w-64">
      {COMMON_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-secondary"
          onClick={() => onEmojiSelect(emoji)}
        >
          <span className="text-lg">{emoji}</span>
        </Button>
      ))}
    </div>
  )

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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        fixed md:relative
        z-50 md:z-auto
        w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-300 ease-in-out
        h-full
      `}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Slack Clone</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 p-0 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={user.avatarUrl} alt={user.login} />
              <AvatarFallback>{user.login.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{user.login}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Channels</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChannelInput(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showChannelInput && (
              <div className="mb-3">
                <Input
                  placeholder="Channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'channel')}
                  onBlur={() => {
                    if (!newChannelName.trim()) {
                      setShowChannelInput(false)
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
              </div>
            )}
            
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => selectChannel(channel.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                      currentChannel === channel.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                    }`}
                  >
                    <Hash className="h-4 w-4" />
                    <span className="flex-1 text-left">{channel.name}</span>
                    {getChannelMessageCount(channel.id) > 0 && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        {getChannelMessageCount(channel.id)}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-2 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 p-0 md:hidden mr-2"
          >
            <List className="h-4 w-4" />
          </Button>
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground truncate">
            {channels.find(c => c.id === currentChannel)?.name || currentChannel}
          </h2>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <p className="text-sm text-muted-foreground hidden sm:block truncate">
            {channels.find(c => c.id === currentChannel)?.description}
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-2 sm:p-4">
          <div className="space-y-4">
            {currentChannelMessages.length === 0 ? (
              <div className="text-center py-12">
                <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Welcome to #{channels.find(c => c.id === currentChannel)?.name}
                </h3>
                <p className="text-muted-foreground px-4">
                  This is the beginning of your conversation. Start chatting!
                </p>
              </div>
            ) : (
              <TooltipProvider>
                {currentChannelMessages.map((message) => (
                  <div key={message.id} className="flex gap-3 group hover:bg-accent/25 transition-colors duration-200 rounded-lg p-3 -m-3">
                    <Avatar className="w-8 h-8 mt-0.5 flex-shrink-0">
                      <AvatarImage src={message.userAvatar} alt={message.userName} />
                      <AvatarFallback>{message.userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground truncate">
                          {message.userName}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(message.timestamp)}
                        </span>
                        <div className="flex-1"></div>
                        
                        {/* Add Reaction Button - Top Right */}
                        <Popover 
                          open={openEmojiPickers.has(message.id)}
                          onOpenChange={(open) => {
                            setOpenEmojiPickers(prev => {
                              const newSet = new Set(prev)
                              if (open) {
                                newSet.add(message.id)
                              } else {
                                newSet.delete(message.id)
                              }
                              return newSet
                            })
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground text-4xl font-bold"
                            >
                              <Smiley className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-accent/20" side="top" align="end">
                            <div className="relative">
                              {/* Connecting line to message */}
                              <div className="absolute -bottom-2 right-4 w-px h-2 bg-accent/30"></div>
                              <EmojiPicker onEmojiSelect={(emoji) => {
                                addReaction(message.id, emoji)
                                setOpenEmojiPickers(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(message.id)
                                  return newSet
                                })
                              }} />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="relative">
                        <p className="text-sm text-foreground leading-relaxed break-words mb-2">
                          {message.content}
                        </p>
                        
                        {/* Reactions */}
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          {message.reactions?.map((reaction) => (
                            <Tooltip key={reaction.emoji}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-6 px-2 py-0 text-xs rounded-full border-border hover:bg-secondary ${
                                    reaction.users.includes(user?.id || '') 
                                      ? 'bg-accent/20 border-accent text-accent-foreground' 
                                      : ''
                                  }`}
                                  onClick={() => addReaction(message.id, reaction.emoji)}
                                >
                                  <span className="mr-1">{reaction.emoji}</span>
                                  <span className="text-black text-sm font-medium">{reaction.count}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {reaction.users.length === 1 
                                    ? `${getUserName(reaction.users[0])} reacted with ${reaction.emoji}` 
                                    : `${reaction.users.map(userId => getUserName(userId)).join(', ')} reacted with ${reaction.emoji}`
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TooltipProvider>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-2 sm:p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              placeholder={`Message #${channels.find(c => c.id === currentChannel)?.name || currentChannel}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'message')}
              className="flex-1 text-sm"
              id="message-input"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!messageInput.trim()}
              size="sm"
              className="flex-shrink-0"
            >
              <PaperPlaneRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App