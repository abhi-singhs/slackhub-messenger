import { UserInfo, Message, Channel, UserStatus } from '@/types'
import { MessagesList } from './MessagesList'
import { SearchResults } from './SearchResults'

interface MessagesViewProps {
  messages: Message[]
  channels: Channel[]
  user: UserInfo | null
  userStatus: UserStatus
  openEmojiPickers: Set<string>
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
  onMessageClick?: (messageId: string) => void
  onStartThread?: (messageId: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  searchQuery?: string
}

export function MessagesView({
  messages,
  channels,
  user,
  userStatus,
  openEmojiPickers,
  onEmojiPickerToggle,
  onReactionAdd,
  onMessageClick,
  onStartThread,
  onEditMessage,
  onDeleteMessage,
  searchQuery
}: MessagesViewProps) {
  
  // If we have a search query, show search results
  if (searchQuery && searchQuery.length >= 2) {
    return (
      <SearchResults
        messages={messages}
        channels={channels}
        user={user}
        userStatus={userStatus}
        searchQuery={searchQuery}
        openEmojiPickers={openEmojiPickers}
        onEmojiPickerToggle={onEmojiPickerToggle}
        onReactionAdd={onReactionAdd}
        onMessageClick={onMessageClick}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />
    )
  }

  // Otherwise show regular messages list
  return (
    <MessagesList
      messages={messages}
      user={user}
      openEmojiPickers={openEmojiPickers}
      userStatus={userStatus}
      onEmojiPickerToggle={onEmojiPickerToggle}
      onReactionAdd={onReactionAdd}
      onStartThread={onStartThread}
      onEditMessage={onEditMessage}
      onDeleteMessage={onDeleteMessage}
    />
  )
}