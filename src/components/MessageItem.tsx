import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Smiley, Chat } from '@phosphor-icons/react'
import { Message, UserInfo, UserStatus } from '@/types'
import { formatTime, getUserName } from '@/utils'
import { highlightSearchTerm } from '@/lib/utils'
import { EmojiPicker } from './EmojiPicker'
import { StatusIndicator } from './StatusIndicator'

interface MessageItemProps {
  message: Message
  user: UserInfo | null
  messages?: Message[]
  isEmojiPickerOpen?: boolean
  searchQuery?: string
  showReactionsOnly?: boolean
  userStatus?: UserStatus
  onEmojiPickerToggle?: (open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  onStartThread?: (messageId: string) => void
}

export const MessageItem = ({
  message,
  user,
  messages = [],
  isEmojiPickerOpen = false,
  searchQuery,
  showReactionsOnly = false,
  userStatus = 'active',
  onEmojiPickerToggle = () => {},
  onReactionAdd,
  onStartThread
}: MessageItemProps) => {
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, index, array) => {
      // Handle different formatting
      let formattedLine = line
      
      // Quote formatting check first
      const isQuote = line.startsWith('> ')
      if (isQuote) {
        formattedLine = formattedLine.substring(2) // Remove '> '
      }
      
      // Code block formatting check
      const isCodeBlock = line.startsWith('```')
      
      // Skip formatting for code blocks
      if (!isCodeBlock) {
        // Bold formatting
        formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Italic formatting
        formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Strikethrough formatting
        formattedLine = formattedLine.replace(/~~(.*?)~~/g, '<del>$1</del>')
        
        // Inline code formatting
        formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
        
        // Apply search highlighting after other formatting
        if (searchQuery && searchQuery.trim()) {
          formattedLine = highlightSearchTerm(formattedLine, searchQuery.trim())
        }
      }
      
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
    })
  }

  return (
    <div className="flex gap-3 group hover:bg-accent/25 transition-colors duration-200 rounded-lg p-3 -m-3">
      <Avatar className="w-8 h-8 mt-0.5 flex-shrink-0" showOnlineIndicator={true}>
        <AvatarImage 
          src={message.userAvatar} 
          alt={message.userName} 
          showOnlineIndicator={true}
          status={message.userId === user?.id ? userStatus : 'active'}
        />
        <AvatarFallback>{message.userName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar> 
      <div className="flex-1 min-w-0 relative">
        {/* Full-width thread trigger button */}
        {onStartThread && !message.threadId && !showReactionsOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute inset-0 w-full h-full opacity-0 hover:opacity-0 z-10 rounded-lg"
            onClick={() => onStartThread(message.id)}
          >
            <span className="sr-only">Start thread</span>
          </Button>
        )}
        
        <div className="flex items-baseline gap-2 mb-1 relative z-20">
          <span className="font-medium text-sm text-foreground truncate">
            <span dangerouslySetInnerHTML={{ 
              __html: searchQuery && searchQuery.trim() 
                ? highlightSearchTerm(message.userName, searchQuery.trim()) 
                : message.userName 
            }} />
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(message.timestamp)}
          </span>
          <div className="flex-1"></div>
          
          {!showReactionsOnly && (
            <>
              {/* Thread indicator icon */}
              {onStartThread && !message.threadId && (
                <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Chat className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Add Reaction Button */}
              <Popover 
                open={isEmojiPickerOpen}
                onOpenChange={onEmojiPickerToggle}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground relative z-30"
                    data-emoji-picker
                  >
                    <Smiley className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-accent/20 mb-2 md:mb-0" side="top" align="end" data-emoji-picker>
                  <div className="relative">
                    {/* Connecting line to message */}
                    <div className="absolute -bottom-2 right-4 w-px h-2 bg-accent/30"></div>
                    <EmojiPicker onEmojiSelect={(emoji) => {
                      onReactionAdd(message.id, emoji)
                      onEmojiPickerToggle(false)
                    }} />
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        <div className="relative z-20">
          <div className="text-sm text-foreground leading-relaxed break-words mb-2">
            {renderMessageContent(message.content)}
          </div>
          
          {/* Thread Indicator */}
          {!message.threadId && (message.replyCount || 0) > 0 && onStartThread && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground mb-2 p-1 h-auto relative z-30"
              onClick={() => onStartThread(message.id)}
            >
              <Chat className="h-3 w-3 mr-1" />
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </Button>
          )}
          
          {/* Reactions */}
          <div className="flex items-center gap-1 flex-wrap mb-1 relative z-20">
            {message.reactions?.map((reaction) => (
              <Tooltip key={reaction.emoji}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-6 px-2 py-0 text-xs rounded-full border-border hover:bg-secondary relative z-30 ${
                      reaction.users.includes(user?.id || '') 
                        ? 'bg-accent/20 border-accent text-accent-foreground' 
                        : ''
                    }`}
                    onClick={() => onReactionAdd(message.id, reaction.emoji)}
                  >
                    <span className="mr-1">{reaction.emoji}</span>
                    <span className="text-black text-sm font-medium">{reaction.count}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {reaction.users.length === 1 
                      ? `${getUserName(reaction.users[0], messages)} reacted with ${reaction.emoji}` 
                      : `${reaction.users.map(userId => getUserName(userId, messages)).join(', ')} reacted with ${reaction.emoji}`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}