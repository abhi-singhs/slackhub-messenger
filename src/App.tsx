import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Hash, Send, Plus } from '@phosphor-icons/react'

interface Message {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string
  timestamp: number
  channelId: string
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

function App() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [currentChannel, setCurrentChannel] = useState<string>('general')
  const [messageInput, setMessageInput] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [showChannelInput, setShowChannelInput] = useState(false)
  
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
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getChannelMessageCount = (channelId: string) => {
    return messages.filter(msg => msg.channelId === channelId).length
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Slack Clone</h1>
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
                    onClick={() => setCurrentChannel(channel.id)}
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-2 border-b border-border bg-card">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">
            {channels.find(c => c.id === currentChannel)?.name || currentChannel}
          </h2>
          <Separator orientation="vertical" className="h-6" />
          <p className="text-sm text-muted-foreground">
            {channels.find(c => c.id === currentChannel)?.description}
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {currentChannelMessages.length === 0 ? (
              <div className="text-center py-12">
                <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Welcome to #{channels.find(c => c.id === currentChannel)?.name}
                </h3>
                <p className="text-muted-foreground">
                  This is the beginning of your conversation. Start chatting!
                </p>
              </div>
            ) : (
              currentChannelMessages.map((message) => (
                <div key={message.id} className="flex gap-3 group">
                  <Avatar className="w-8 h-8 mt-0.5">
                    <AvatarImage src={message.userAvatar} alt={message.userName} />
                    <AvatarFallback>{message.userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {message.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              placeholder={`Message #${channels.find(c => c.id === currentChannel)?.name || currentChannel}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'message')}
              className="flex-1"
              id="message-input"
            />
            <Button onClick={sendMessage} disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App