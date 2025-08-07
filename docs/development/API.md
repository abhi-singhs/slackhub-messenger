# API Documentation

This document provides comprehensive API documentation for SlackHub Messenger's custom hooks, components, and utilities.

## Authentication API

### `useAuth()`

Central authentication hook that manages user sessions and authentication state.

```typescript
const {
  user,           // Current authenticated user
  session,        // Supabase session object
  loading,        // Authentication loading state
  signUp,         // Sign up with email/password
  signIn,         // Sign in with email/password
  signInWithGitHub, // OAuth sign in
  signInAnonymously, // Anonymous sign in
  signOut,        // Sign out current user
  updateProfile,  // Update user profile
  updateUserStatus, // Update user status
  updateUserLocal // Update local user state
} = useAuth()
```

#### Types
```typescript
interface UserInfo {
  id: string
  login: string
  avatarUrl: string
  email: string
  isOwner: boolean
  status: UserStatus
}

type UserStatus = 'active' | 'away' | 'busy'
```

#### Methods

**`signUp(email: string, password: string, username: string)`**
```typescript
const { data, error } = await signUp(
  'user@example.com',
  'password123',
  'username'
)
```

**`signIn(email: string, password: string)`**
```typescript
const { data, error } = await signIn('user@example.com', 'password123')
```

**`updateProfile(updates: Partial<UserProfile>)`**
```typescript
const { data, error } = await updateProfile({
  username: 'newusername',
  avatar_url: 'https://example.com/avatar.jpg'
})
```

## Data Management API

### `useSupabaseData(user: UserInfo | null)`

Main data management hook for messages, channels, and real-time subscriptions.

```typescript
const {
  currentChannel,      // Currently selected channel ID
  setCurrentChannel,   // Set active channel
  messages,           // Array of messages
  channels,           // Array of channels
  lastReadTimestamps, // Read status per channel
  loading,            // Data loading state
  sendMessage,        // Send new message
  createChannel,      // Create new channel
  updateChannel,      // Update channel details
  deleteChannel,      // Delete channel
  addReaction,        // Add emoji reaction
  markChannelAsRead,  // Mark channel as read
  editMessage,        // Edit existing message
  deleteMessage       // Delete message
} = useSupabaseData(user)
```

#### Types
```typescript
interface Message {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string
  timestamp: number
  channelId: string
  reactions?: MessageReaction[]
  threadId?: string
  replyCount?: number
  attachments?: FileAttachment[]
  edited?: boolean
  editedAt?: number
}

interface Channel {
  id: string
  name: string
  description?: string
}

interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}
```

#### Methods

**`sendMessage(content: string, channelId?: string, threadId?: string, attachments?: FileAttachment[])`**
```typescript
await sendMessage(
  'Hello world!',
  'channel-id',
  undefined, // No thread
  [{ id: '1', name: 'file.pdf', url: '...', type: 'application/pdf', size: 1024 }]
)
```

**`createChannel(name: string): Promise<string>`**
```typescript
const channelId = await createChannel('new-channel')
```

**`addReaction(messageId: string, emoji: string)`**
```typescript
await addReaction('message-id', '👍')
```

## Settings API

### `useSupabaseSettings(user: UserInfo | null)`

User preferences and application settings management with localStorage persistence.

```typescript
const {
  theme,                    // Current color theme
  setTheme,                // Set color theme
  isDarkMode,              // Dark mode state
  setIsDarkMode,           // Toggle dark mode
  loading,                 // Settings loading state
  updateSettings,          // Batch update settings
  settings,                // SettingsModal-compatible object
  updateTheme,             // Theme mode updater (light/dark)
  updateColorTheme         // Color theme updater
} = useSupabaseSettings(user)
```

**Features:**
- **Immediate theme application** via localStorage on page refresh
- **Database synchronization** for cross-device consistency  
- **Real-time updates** across multiple sessions
- **Offline support** with localStorage fallback

#### Methods

**`setTheme(theme: string)`**
```typescript
setTheme('blue') // 'blue' | 'green' | 'purple' | 'orange' | 'red'
```

**`updateSettings(updates: Partial<Settings>)`**
```typescript
await updateSettings({
  theme: 'dark',
  notificationSettings: {
    ...notificationSettings,
    soundEnabled: false
  }
})
```

**localStorage Keys:**
- `user-theme`: Current color theme (e.g., 'blue', 'green')
- `user-dark-mode`: Dark mode setting ('true' or 'false')

These keys ensure theme persistence across page refreshes and provide instant theme application on app load.

## User Status API

### `useUserStatus()`

User presence and status management.

```typescript
const {
  status,     // Current user status
  setStatus   // Update user status
} = useUserStatus()
```

#### Methods

**`setStatus(status: UserStatus)`**
```typescript
setStatus('away') // 'active' | 'away' | 'busy'
```

## Utility APIs

### File Upload Utilities

```typescript
// File upload helper
import { uploadFile } from '@/lib/fileUtils'

const fileAttachment = await uploadFile(file, 'attachments')
```

### Supabase Client

```typescript
import { supabase } from '@/lib/supabase'

// Direct Supabase operations
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

## Component APIs

### Core Components

#### `<MessageItem />`

Individual message display component.

```typescript
interface MessageItemProps {
  message: Message
  currentUser?: UserInfo
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (messageId: string) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
}

<MessageItem
  message={message}
  currentUser={user}
  onReact={handleReaction}
  onReply={handleReply}
/>
```

#### `<MessageInput />`

Message composition component with rich text editing.

```typescript
interface MessageInputProps {
  currentChannel: string
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void
  placeholder?: string
  disabled?: boolean
}

<MessageInput
  currentChannel={channelId}
  onSendMessage={sendMessage}
  placeholder="Type a message..."
/>
```

#### `<EmojiPicker />`

Emoji selection component.

```typescript
interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  isOpen: boolean
  onClose: () => void
}

<EmojiPicker
  onSelect={handleEmojiSelect}
  isOpen={showPicker}
  onClose={() => setShowPicker(false)}
/>
```

### UI Components (shadcn/ui)

#### `<Button />`

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  children: React.ReactNode
}

<Button variant="outline" size="sm" onClick={handleClick}>
  Click me
</Button>
```

#### `<Dialog />`

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

#### `<Avatar />`

```typescript
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.login} />
  <AvatarFallback>{user.login[0]}</AvatarFallback>
</Avatar>
```

## Error Handling

### Error Types

```typescript
interface APIError {
  message: string
  code?: string
  details?: any
}
```

### Error Handling Pattern

```typescript
try {
  const result = await apiOperation()
  // Handle success
} catch (error) {
  console.error('Operation failed:', error)
  // Show user-friendly error message
  toast.error('Something went wrong. Please try again.')
}
```

## Real-time Subscriptions

### Setting Up Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('messages')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        console.log('Real-time update:', payload)
        // Handle update
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}, [])
```

### Subscription Events

- `INSERT` - New records added
- `UPDATE` - Records modified
- `DELETE` - Records removed
- `*` - All change events

## Performance Considerations

### Optimistic Updates

```typescript
// Update UI immediately
setMessages(prev => [...prev, optimisticMessage])

try {
  // Send to server
  const result = await supabase.from('messages').insert(message)
  // Replace optimistic with real data
  setMessages(prev => prev.map(msg => 
    msg.id === optimisticMessage.id ? realMessage : msg
  ))
} catch (error) {
  // Rollback on error
  setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
}
```

### Pagination

```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .range(0, 19) // First 20 items
  .order('created_at', { ascending: false })
```

### Caching

```typescript
// Use React Query or SWR for caching
const { data, error, mutate } = useSWR(
  ['messages', channelId],
  () => fetchMessages(channelId)
)
```

## Testing APIs

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

test('useAuth returns user when authenticated', () => {
  const { result } = renderHook(() => useAuth())
  expect(result.current.user).toBeDefined()
})
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react'
import { MessageItem } from '@/components/MessageItem'

test('renders message content', () => {
  render(<MessageItem message={mockMessage} />)
  expect(screen.getByText(mockMessage.content)).toBeInTheDocument()
})
```

### Mock Data

```typescript
const mockMessage: Message = {
  id: '1',
  content: 'Test message',
  userId: 'user1',
  userName: 'Test User',
  userAvatar: '',
  timestamp: Date.now(),
  channelId: 'channel1'
}

const mockUser: UserInfo = {
  id: 'user1',
  login: 'testuser',
  avatarUrl: '',
  email: 'test@example.com',
  isOwner: false,
  status: 'active'
}
```

## Environment Configuration

### Required Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Environment Variables

```env
VITE_MAX_FILE_SIZE=10485760
VITE_ENABLE_DEBUG=false
VITE_API_TIMEOUT=30000
```

---

For more detailed examples and use cases, see the [Development Guide](../development/DEVELOPMENT.md) and component source code.
