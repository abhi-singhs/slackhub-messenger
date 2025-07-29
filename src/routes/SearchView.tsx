import { useNavigate, useSearchParams } from 'react-router-dom'
import { UserInfo, Channel, Message } from '@/types'
import { SearchResults } from '@/components/SearchResults'

interface SearchViewProps {
  messages: Message[]
  channels: Channel[]
  user: UserInfo
  openEmojiPickers: Set<string>
  onEmojiPickerToggle: (messageId: string, open: boolean) => void
  onReactionAdd: (messageId: string, emoji: string) => void
}

export function SearchView({
  messages,
  channels,
  user,
  openEmojiPickers,
  onEmojiPickerToggle,
  onReactionAdd
}: SearchViewProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const handleBack = () => {
    navigate(-1)
  }

  const handleNavigateToMessage = (channelId: string, messageId: string) => {
    navigate(`/channel/${channelId}?message=${messageId}`)
  }

  return (
    <SearchResults
      searchQuery={searchQuery}
      messages={messages}
      channels={channels}
      user={user}
      openEmojiPickers={openEmojiPickers}
      onEmojiPickerToggle={onEmojiPickerToggle}
      onReactionAdd={onReactionAdd}
      onBack={handleBack}
      onNavigateToMessage={handleNavigateToMessage}
    />
  )
}