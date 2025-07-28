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
import { Hash, PaperPlaneRight, Plus, List, X, Smiley, TextB, TextItalic, Minus, Quotes, Code } from '@phosphor-icons/react'

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
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  
  const [messages, setMessages] = useKV<Message[]>('slack-messages', [])
  const [channels, setChannels] = useKV<Channel[]>('slack-channels', [
    { id: 'general', name: 'general', description: 'General discussion' },
    { id: 'random', name: 'random', description: 'Random chatter' },
    { id: 'dev', name: 'dev', description: 'Development talk' }
  ])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await spark.user()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user data:', error)
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
    try {
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
      
      // Clear the contentEditable div
      if (messageInputRef.current) {
        messageInputRef.current.innerHTML = ''
        messageInputRef.current.focus()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
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
    try {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (action === 'message') {
          sendMessage()
        } else {
          createChannel()
        }
      }
    } catch (error) {
      console.error('Error handling key press:', error)
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

  // Text formatting functions for contentEditable
  const formatText = (format: 'bold' | 'italic' | 'strikethrough' | 'quote' | 'code') => {
    try {
      const input = messageInputRef.current
      if (!input) return

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      let formattedHTML = ''

      switch (format) {
        case 'bold':
          if (selectedText) {
            formattedHTML = `<strong>${selectedText}</strong>`
          } else {
            formattedHTML = '<strong></strong>'
          }
          break
        case 'italic':
          if (selectedText) {
            formattedHTML = `<em>${selectedText}</em>`
          } else {
            formattedHTML = '<em></em>'
          }
          break
        case 'strikethrough':
          if (selectedText) {
            formattedHTML = `<del>${selectedText}</del>`
          } else {
            formattedHTML = '<del></del>'
          }
          break
        case 'quote':
          if (selectedText) {
            formattedHTML = `<blockquote class="border-l-2 border-muted-foreground pl-3 text-muted-foreground italic">${selectedText}</blockquote>`
          } else {
            formattedHTML = '<blockquote class="border-l-2 border-muted-foreground pl-3 text-muted-foreground italic"></blockquote>'
          }
          break
        case 'code':
          if (selectedText) {
            if (selectedText.includes('\n')) {
              formattedHTML = `<pre class="bg-muted p-2 rounded font-mono text-xs block">${selectedText}</pre>`
            } else {
              formattedHTML = `<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">${selectedText}</code>`
            }
          } else {
            formattedHTML = '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono"></code>'
          }
          break
      }

      // Replace the selected content with formatted HTML
      range.deleteContents()
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = formattedHTML
      const fragment = document.createDocumentFragment()
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      range.insertNode(fragment)

      // Update the message input state
      setMessageInput(input.innerText || '')

      // Position cursor at the end of inserted content
      selection.removeAllRanges()
      const newRange = document.createRange()
      
      // Safely position cursor after the inserted content
      if (fragment.lastChild) {
        newRange.setStartAfter(fragment.lastChild)
      } else if (fragment.childNodes.length > 0) {
        newRange.setStartAfter(fragment.childNodes[0])
      } else {
        // If fragment is empty, just place cursor at the current position
        newRange.setStart(range.startContainer, range.startOffset)
      }
      
      newRange.collapse(true)
      selection.addRange(newRange)
      
      input.focus()
    } catch (error) {
      console.error('Error formatting text:', error)
    }
  }

  const insertEmoji = (emoji: string) => {
    try {
      const input = messageInputRef.current
      if (!input) return

      const selection = window.getSelection()
      if (!selection) return

      // If there's no selection, place at the end
      if (selection.rangeCount === 0) {
        input.focus()
        const range = document.createRange()
        range.selectNodeContents(input)
        range.collapse(false)
        selection.addRange(range)
      }

      const range = selection.getRangeAt(0)
      const textNode = document.createTextNode(emoji)
      range.insertNode(textNode)
      
      // Move cursor after the emoji
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)

      // Update the message input state
      setMessageInput(input.innerText || '')
      input.focus()
    } catch (error) {
      console.error('Error inserting emoji:', error)
    }
  }

  // Convert HTML content to plain text for storage
  const getPlainTextFromHTML = (html: string): string => {
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
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 flex-shrink-0">
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
          </div>
          
          <div className="flex-1 min-h-0 px-4 pb-4">
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
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2 sm:p-4">
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
                          <div className="text-sm text-foreground leading-relaxed break-words mb-2">
                            {message.content.split('\n').map((line, index, array) => {
                              // Handle different formatting
                              let formattedLine = line
                              
                              // Bold formatting
                              formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              
                              // Italic formatting
                              formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
                              
                              // Strikethrough formatting
                              formattedLine = formattedLine.replace(/~~(.*?)~~/g, '<del>$1</del>')
                              
                              // Inline code formatting
                              formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                              
                              // Quote formatting
                              const isQuote = line.startsWith('> ')
                              if (isQuote) {
                                formattedLine = formattedLine.substring(2) // Remove '> '
                              }
                              
                              // Code block formatting
                              const isCodeBlock = line.startsWith('```')
                              
                              return (
                                <span key={index}>
                                  {isQuote ? (
                                    <span className="border-l-2 border-muted-foreground pl-3 text-muted-foreground italic block">
                                      <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                                    </span>
                                  ) : isCodeBlock ? (
                                    <span className="bg-muted p-2 rounded font-mono text-xs block">
                                      {line.replace(/```/g, '')}
                                    </span>
                                  ) : (
                                    <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                                  )}
                                  {index < array.length - 1 && <br />}
                                </span>
                              );
                            })}
                          </div>
                          
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
        </div>

        {/* Message Input */}
        <div className="p-2 sm:p-4 border-t border-border bg-card">
          {/* Formatting Toolbar */}
          <div className="flex items-center justify-between gap-1 mb-2 pb-2 border-b border-border">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('bold')}
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Bold"
              >
                <TextB className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('italic')}
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Italic"
              >
                <TextItalic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('strikethrough')}
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Strikethrough"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('quote')}
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Quote"
              >
                <Quotes className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('code')}
                className="h-8 w-8 p-0 hover:bg-secondary"
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-border mx-1"></div>
              <Popover 
                open={showInputEmojiPicker}
                onOpenChange={setShowInputEmojiPicker}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-secondary"
                    title="Add Emoji"
                  >
                    <Smiley className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="top" align="start">
                  <EmojiPicker onEmojiSelect={(emoji) => {
                    insertEmoji(emoji)
                    setShowInputEmojiPicker(false)
                  }} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Automatic Preview */}
          {messageInput.trim() && (
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1 px-1">This is how your message will appear:</div>
              <div className="min-h-[40px] p-3 bg-muted/30 border border-border rounded-md text-sm">
                <div className="text-foreground leading-relaxed break-words">
                  {messageInput.split('\n').map((line, index, array) => {
                    // Handle different formatting for preview
                    let formattedLine = line
                    
                    // Bold formatting
                    formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    
                    // Italic formatting
                    formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
                    
                    // Strikethrough formatting
                    formattedLine = formattedLine.replace(/~~(.*?)~~/g, '<del>$1</del>')
                    
                    // Inline code formatting
                    formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                    
                    // Quote formatting
                    const isQuote = line.startsWith('> ')
                    if (isQuote) {
                      formattedLine = formattedLine.substring(2) // Remove '> '
                    }
                    
                    // Code block formatting
                    const isCodeBlock = line.startsWith('```')
                    
                    return (
                      <span key={index}>
                        {isQuote ? (
                          <span className="border-l-2 border-muted-foreground pl-3 text-muted-foreground italic block">
                            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                          </span>
                        ) : isCodeBlock ? (
                          <span className="bg-muted p-2 rounded font-mono text-xs block">
                            {line.replace(/```/g, '')}
                          </span>
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                        )}
                        {index < array.length - 1 && <br />}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <div 
              ref={messageInputRef}
              contentEditable
              className="flex-1 min-h-[40px] max-h-32 overflow-y-auto p-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_strong]:font-bold [&_em]:italic [&_del]:line-through [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs [&_pre]:block"
              onInput={(e) => {
                try {
                  const target = e.target as HTMLDivElement
                  const plainText = getPlainTextFromHTML(target.innerHTML)
                  setMessageInput(plainText)
                } catch (error) {
                  console.error('Error handling input:', error)
                }
              }}
              onKeyDown={(e) => handleKeyPress(e, 'message')}
              data-placeholder={`Message #${channels.find(c => c.id === currentChannel)?.name || currentChannel}`}
              suppressContentEditableWarning={true}
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