import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CalendarBlank, Hash, User } from '@phosphor-icons/react'
import { Message, Channel, UserInfo } from '@/types'
import { MessageItem } from '@/components/MessageItem'

interface SearchResult {
  message: Message
  contextMessages: Message[]
  channel: Channel
}

interface SearchResultsProps {
  searchQuery: string
  messages: Message[]
  channels: Channel[]
  user: UserInfo
  openEmojiPickers: Set<string>
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  onBack: () => void
  onNavigateToMessage: (channelId: string, messageId: string) => void
}

export const SearchResults = ({
  searchQuery,
  messages,
  channels,
  user,
  openEmojiPickers,
  onEmojiPickerToggle,
  onReactionAdd,
  onBack,
  onNavigateToMessage
}: SearchResultsProps) => {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  // Search results with context
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    // Find matching messages
    const matchingMessages = messages.filter(message =>
      message.content.toLowerCase().includes(query) ||
      message.userName.toLowerCase().includes(query)
    )

    // Add context for each matching message
    matchingMessages.forEach(message => {
      const channel = channels.find(c => c.id === message.channelId)
      if (!channel) return

      // Get surrounding messages for context (2 before, 2 after)
      const channelMessages = messages
        .filter(m => m.channelId === message.channelId)
        .sort((a, b) => a.timestamp - b.timestamp)
      
      const messageIndex = channelMessages.findIndex(m => m.id === message.id)
      const contextStart = Math.max(0, messageIndex - 2)
      const contextEnd = Math.min(channelMessages.length, messageIndex + 3)
      const contextMessages = channelMessages.slice(contextStart, contextEnd)

      results.push({
        message,
        contextMessages,
        channel
      })
    })

    return results.sort((a, b) => b.message.timestamp - a.message.timestamp)
  }, [searchQuery, messages, channels])

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result)
  }

  const handleNavigateToMessage = (result: SearchResult) => {
    onNavigateToMessage(result.channel.id, result.message.id)
    onBack()
  }

  if (selectedResult) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedResult(null)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{selectedResult.channel.name}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatDate(selectedResult.message.timestamp)}
          </Badge>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateToMessage(selectedResult)}
            className="text-xs"
          >
            Go to Message
          </Button>
        </div>

        {/* Message Context */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-1">
            {selectedResult.contextMessages.map((msg, index) => {
              const isTargetMessage = msg.id === selectedResult.message.id
              return (
                <div
                  key={msg.id}
                  className={`transition-colors ${
                    isTargetMessage ? 'bg-accent/10 border border-accent/20 rounded-lg p-2' : ''
                  }`}
                >
                  <MessageItem
                    message={msg}
                    user={user}
                    isEmojiPickerOpen={openEmojiPickers.has(msg.id)}
                    searchQuery={isTargetMessage ? searchQuery : ''}
                    onEmojiPickerToggle={onEmojiPickerToggle}
                    onReactionAdd={onReactionAdd}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-medium">Search Results</span>
          <Badge variant="secondary" className="text-xs">
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
          </Badge>
        </div>
        <div className="flex-1" />
        <div className="text-sm text-muted-foreground">
          "{searchQuery}"
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">No messages found</h3>
            <p className="text-muted-foreground max-w-md">
              Try adjusting your search terms or check the spelling. You can search by message content or user names.
            </p>
          </div>
        ) : (
          <div className="p-4 max-w-4xl mx-auto">
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <Card
                  key={`${result.message.id}-${index}`}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  {/* Result Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{result.channel.name}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{result.message.userName}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <CalendarBlank className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(result.message.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="space-y-2">
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(result.message.content, searchQuery)
                      }}
                    />
                    
                    {/* Context indicator */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Click to see {result.contextMessages.length} messages with context</span>
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {result.contextMessages.length} messages
                      </Badge>
                    </div>
                  </div>

                  {/* Reactions if any */}
                  {result.message.reactions && result.message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border">
                      {result.message.reactions.map((reaction, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {reaction.emoji} {reaction.count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}