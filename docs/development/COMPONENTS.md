# Component Library Documentation

This document provides detailed information about the UI components used in SlackHub Messenger, including both custom components and shadcn/ui components.

## Component Architecture

For architectural patterns and guidelines, see our [Copilot Instructions](../../.github/copilot-instructions.md) which provide comprehensive coding standards for component development.

### Component Categories

- **Core Components** - Application-specific components
- **UI Components** - Reusable shadcn/ui components
- **Layout Components** - Structure and navigation
- **Feature Components** - Domain-specific functionality

## Core Components

### Authentication Components

#### `<AuthComponent />`
Authentication screen with GitHub and Google OAuth plus theme controls.

```typescript
import { AuthComponent } from '@/components/AuthComponent'

<AuthComponent />
```

**Features:**
- GitHub OAuth integration (only)
- Theme color picker and dark mode toggle on the login screen
- Configuration warning if Supabase env vars are missing/invalid
- Error handling and responsive layout

### Messaging Components

#### `<MessageItem />`
Displays individual messages with reactions, threading, and editing capabilities.

```typescript
interface MessageItemProps {
  message: Message
  currentUser?: UserInfo
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (messageId: string) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  showAvatar?: boolean
  isThreadMessage?: boolean
}

<MessageItem
  message={message}
  currentUser={user}
  onReact={handleReaction}
  onReply={openThread}
  onEdit={editMessage}
  onDelete={deleteMessage}
/>
```

**Features:**
- Message content rendering with rich text
- Emoji reactions with user attribution
- File attachment display
- Edit/delete controls for message owners
- Thread reply interface
- Timestamp formatting
- User avatar and name display

#### `<MessageInput />`
Rich text message composition with file upload support.

```typescript
interface MessageInputProps {
  currentChannel: string
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void
  placeholder?: string
  disabled?: boolean
  threadId?: string
}

<MessageInput
  currentChannel={channelId}
  onSendMessage={sendMessage}
  placeholder="Type a message..."
  disabled={loading}
/>
```

**Features:**
- Rich text editing with TipTap
- File upload with drag-and-drop
- Emoji picker integration
- Keyboard shortcuts (Ctrl+Enter to send)
- Auto-resize text area
- Thread reply support

#### `<MessagesList />`
Container for displaying messages with infinite scroll and real-time updates.

```typescript
interface MessagesListProps {
  messages: Message[]
  currentUser?: UserInfo
  loading?: boolean
  onLoadMore?: () => void
  onReact?: (messageId: string, emoji: string) => void
  onReply?: (messageId: string) => void
}

<MessagesList
  messages={messages}
  currentUser={user}
  loading={loading}
  onLoadMore={loadMoreMessages}
/>
```

**Features:**
- Virtual scrolling for performance
- Real-time message updates
- Thread grouping
- Date separators
- Loading states
- Auto-scroll to bottom for new messages

### Navigation Components

#### `<Sidebar />`
Main navigation sidebar with channels, direct messages, and user status.

```typescript
<Sidebar />
```

**Features:**
- Channel list with unread indicators
- Direct message conversations
- User status selector
- Create channel interface
- Responsive collapsible design
- Search functionality

#### `<Header />`
Top navigation bar with search and current channel information.

```typescript
<Header />
```

**Features:**
- Current channel/conversation display
- Global search input
- Quick switcher access
- User menu dropdown
- Responsive layout

#### `<QuickSwitcher />`
Fast channel and conversation switching modal.

```typescript
interface QuickSwitcherProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (channelId: string) => void
}

<QuickSwitcher
  isOpen={showSwitcher}
  onClose={closeSwitcher}
  onSelect={selectChannel}
/>
```

**Features:**
- Fuzzy search for channels and users
- Keyboard navigation
- Recent channels priority
- Create new channel option

### Feature Components

#### `<EmojiPicker />`
Emoji selection interface for reactions and messages.

```typescript
interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  isOpen: boolean
  onClose: () => void
  position?: 'top' | 'bottom'
}

<EmojiPicker
  onSelect={handleEmojiSelect}
  isOpen={showPicker}
  onClose={closePicker}
  position="top"
/>
```

**Features:**
- Categorized emoji grid
- Search functionality
- Recently used emojis
- Skin tone variants
- Keyboard navigation

#### `<FileAttachmentView />`
File attachment display and download interface.

```typescript
interface FileAttachmentViewProps {
  attachment: FileAttachment
  showPreview?: boolean
  allowDownload?: boolean
}

<FileAttachmentView
  attachment={attachment}
  showPreview={true}
  allowDownload={true}
/>
```

**Features:**
- File type icons
- Image/video previews
- Download links
- File size display
- Progress indicators for uploads

### Settings Components

#### `<SettingsModal />`
Application settings and preferences interface.

```typescript
interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

<SettingsModal
  isOpen={showSettings}
  onClose={closeSettings}
/>
```

**Features:**
- Theme selection
- Dark mode toggle
- Notification preferences
- Audio/video settings
- Keyboard shortcuts configuration

#### `<StatusSelector />`
User status selection dropdown.

```typescript
interface StatusSelectorProps {
  currentStatus: UserStatus
  onStatusChange: (status: UserStatus) => void
}

<StatusSelector
  currentStatus={userStatus}
  onStatusChange={updateStatus}
/>
```

**Features:**
- Status options (active, away, busy)
- Custom status messages
- Auto-away functionality

## UI Components (shadcn/ui)

For detailed component implementation patterns, refer to our [Copilot Instructions](../../.github/copilot-instructions.md#component-structure).

### Form Components

#### `<Button />`
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
}

<Button variant="outline" size="sm" onClick={handleClick}>
  Click me
</Button>
```

#### `<Input />`
```typescript
interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  className?: string
}

<Input
  type="text"
  placeholder="Enter text..."
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
/>
```

#### `<Textarea />`
```typescript
<Textarea
  placeholder="Enter message..."
  value={content}
  onChange={(e) => setContent(e.target.value)}
  rows={3}
/>
```

### Display Components

#### `<Avatar />`
```typescript
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.login} />
  <AvatarFallback>{user.login[0]}</AvatarFallback>
</Avatar>
```

#### `<Badge />`
```typescript
<Badge variant="secondary">
  {unreadCount}
</Badge>
```

#### `<Card />`
```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Overlay Components

#### `<Dialog />`
```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### `<Popover />`
```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    Popover content
  </PopoverContent>
</Popover>
```

#### `<Tooltip />`
```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <HelpIcon />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Helpful tooltip text</p>
  </TooltipContent>
</Tooltip>
```

### Navigation Components

#### `<Tabs />`
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Tab 1 content</TabsContent>
  <TabsContent value="tab2">Tab 2 content</TabsContent>
</Tabs>
```

#### `<ScrollArea />`
```typescript
<ScrollArea className="h-96 w-full">
  <div className="p-4">
    Scrollable content
  </div>
</ScrollArea>
```

## Component Development Guidelines

### Best Practices

1. **TypeScript First**: All components must have proper TypeScript interfaces
2. **Composition over Inheritance**: Use composition patterns for reusability
3. **Accessibility**: Follow ARIA guidelines and keyboard navigation standards
4. **Performance**: Use React.memo for expensive components
5. **Testing**: Include unit tests for component logic

### Naming Conventions

- **Components**: PascalCase (`MessageItem`, `EmojiPicker`)
- **Props**: camelCase (`onSelect`, `isVisible`)
- **Files**: PascalCase for components (`MessageItem.tsx`)
- **Hooks**: camelCase starting with "use" (`useMessages`)

### File Structure

```
components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── MessageItem.tsx        # Core components
├── MessageInput.tsx
├── EmojiPicker.tsx
└── ...
```

### Component Template

```typescript
import React from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  children?: React.ReactNode
  className?: string
  // Add specific props here
}

export const Component = React.forwardRef<
  HTMLDivElement,
  ComponentProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("default-classes", className)}
      {...props}
    >
      {children}
    </div>
  )
})

Component.displayName = "Component"
```

## Styling Guidelines

### Tailwind CSS Usage

Follow the patterns established in our [Copilot Instructions](../../.github/copilot-instructions.md#styling-guidelines):

- Use custom CSS variables for colors
- Implement responsive design with mobile-first approach
- Maintain consistent spacing and typography
- Support both light and dark themes

### CSS Variables

```css
/* Colors */
--color-neutral-1 through --color-neutral-12
--color-accent-1 through --color-accent-12
--color-fg, --color-fg-secondary
--color-bg, --color-bg-inset, --color-bg-overlay

/* Spacing */
--size-px, --size-0 through --size-96

/* Border Radius */
--radius-sm through --radius-2xl, --radius-full
```

### Component Styling Example

```typescript
const MessageItem = ({ message, className, ...props }) => {
  return (
    <div
      className={cn(
        "flex gap-3 p-3 hover:bg-neutral-2 rounded-lg",
        "dark:hover:bg-neutral-1",
        message.edited && "opacity-75",
        className
      )}
      {...props}
    >
      {/* Component content */}
    </div>
  )
}
```

### Layout Patterns (Updated)

- Sticky Header: Keep the channel header visible while scrolling for quick context and search access.

  - Use: `sticky top-0 z-10 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60`
  - Separator: Keep a subtle bottom border `border-b border-border`

- Centered Messages Column: Improve readability on wide screens by constraining message width.

  - Wrap the messages container with: `mx-auto w-full max-w-3xl`
  - Apply responsive padding: `py-3 sm:py-4` and move lateral padding to the scroll area (`px-2 sm:px-4`)

- Active Channel Emphasis: Increase contrast and add a light shadow for the active channel in the sidebar.

  - Active class: `bg-accent/90 text-accent-foreground shadow-sm`
  - Inactive/hover: `text-muted-foreground hover:bg-secondary hover:text-secondary-foreground`

These patterns keep the UI clean, readable, and consistent with our Tailwind tokens and shadcn/ui conventions.

## Testing Components

### Testing Best Practices

1. **Render Testing**: Verify components render correctly
2. **Interaction Testing**: Test user interactions and events
3. **Accessibility Testing**: Ensure proper ARIA attributes
4. **Visual Regression**: Test component appearance

### Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { MessageItem } from '@/components/MessageItem'
import { mockMessage, mockUser } from '@/test/mocks'

describe('MessageItem', () => {
  it('renders message content', () => {
    render(<MessageItem message={mockMessage} />)
    expect(screen.getByText(mockMessage.content)).toBeInTheDocument()
  })

  it('calls onReact when reaction is added', () => {
    const onReact = vi.fn()
    render(
      <MessageItem
        message={mockMessage}
        currentUser={mockUser}
        onReact={onReact}
      />
    )
    
    fireEvent.click(screen.getByLabelText('Add reaction'))
    fireEvent.click(screen.getByText('👍'))
    
    expect(onReact).toHaveBeenCalledWith(mockMessage.id, '👍')
  })
})
```

## Performance Considerations

### Optimization Techniques

1. **React.memo**: For expensive components that re-render frequently
2. **useCallback**: For event handlers passed to child components
3. **useMemo**: For expensive calculations
4. **Virtual Scrolling**: For large lists (MessagesList)
5. **Code Splitting**: For large feature components

### Example Optimizations

```typescript
// Memoized component
const MessageItem = React.memo(({ message, onReact }) => {
  const handleReact = useCallback(
    (emoji: string) => onReact(message.id, emoji),
    [message.id, onReact]
  )

  const formattedTime = useMemo(
    () => new Date(message.timestamp).toLocaleTimeString(),
    [message.timestamp]
  )

  return (
    <div>
      {/* Component JSX */}
    </div>
  )
})
```

## Accessibility Guidelines

### ARIA Standards

1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Labels**: Provide descriptive labels for interactive elements
3. **Keyboard Navigation**: Support Tab, Enter, Escape keys
4. **Focus Management**: Handle focus states properly
5. **Screen Reader Support**: Test with screen readers

### Accessibility Example

```typescript
const MessageItem = ({ message }) => {
  return (
    <article
      role="article"
      aria-label={`Message from ${message.userName}`}
      tabIndex={0}
    >
      <header>
        <img
          src={message.userAvatar}
          alt={`${message.userName}'s avatar`}
          role="img"
        />
        <h3>{message.userName}</h3>
      </header>
      <div aria-label="Message content">
        {message.content}
      </div>
      <button
        aria-label="Add reaction to this message"
        onClick={handleAddReaction}
      >
        React
      </button>
    </article>
  )
}
```

---

For more detailed development guidelines and patterns, see our [Development Guide](./DEVELOPMENT.md).
