import { UserInfo, Message, Channel } from '@/types'
import { MessagesList } from './MessagesList'
import { SearchResults } from './SearchResults'
import { useUserStatus } from '@/hooks/useUserStatus'

interface MessagesViewProps {
  messages: Message[]
  channels: Channel[]
  user: UserInfo | null
  openEmojiPickers: Set<string>
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  onMessageClick?: (messageId: string) => void
  onStartThread?: (messageId: string) => void
  searchQuery?: string
}

export function MessagesView({
  messages,
  channels,
  user,
  openEmojiPickers,
  onEmojiPickerToggle,
  onReactionAdd,
  onMessageClick,
  onStartThread,
  searchQuery
}: MessagesViewProps) {
  const { status } = useUserStatus()
  
  // If we have a search query, show search results
  if (searchQuery && searchQuery.length >= 2) {
    return (
      <SearchResults
        messages={messages}
        channels={channels}
        user={user}
        searchQuery={searchQuery}
        openEmojiPickers={openEmojiPickers}
        onEmojiPickerToggle={onEmojiPickerToggle}
        onReactionAdd={onReactionAdd}
        onMessageClick={onMessageClick}
      />
    )
  }

  // Otherwise show regular messages list
  return (
    <MessagesList
      messages={messages}
      user={user}
      openEmojiPickers={openEmojiPickers}
      userStatus={status}
      onEmojiPickerToggle={onEmojiPickerToggle}
      onReactionAdd={onReactionAdd}
      onStartThread={onStartThread}
    />
  )
}