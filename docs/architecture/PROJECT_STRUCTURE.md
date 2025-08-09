# SlackHub Messenger - Project Structure

This document outlines the organization and structure of the Slackhub project.

## Directory Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn UI components
│   ├── EmojiPicker.tsx # Emoji picker component
│   ├── Header.tsx      # App header with search
│   ├── MessageInput.tsx # Message input with rich text
│   ├── MessageItem.tsx # Individual message display
│   ├── MessagesList.tsx # Messages list container
│   ├── MessagesView.tsx # Main messages view
│   ├── QuickSwitcher.tsx # Channel quick switcher
│   ├── RichTextEditor.tsx # Rich text editor
│   ├── SearchInput.tsx # Search input component
│   ├── SearchResults.tsx # Search results display
│   ├── SettingsModal.tsx # Settings modal
│   ├── Sidebar.tsx     # Sidebar with channels
│   ├── StatusIndicator.tsx # User status indicator
│   ├── StatusSelector.tsx # Status selection dropdown
│   ├── ThreadView.tsx  # Thread/reply view
│   └── KeyboardShortcutsHelp.tsx # Keyboard shortcuts help
├── hooks/              # Custom React hooks
│   ├── use-mobile.ts   # Mobile detection hook
│   ├── useKeyboardShortcuts.ts # Keyboard shortcuts handler
│   ├── useSupabaseSettings.ts  # Settings (theme, notifications)
│   ├── useSupabaseData.ts # Main data management (channels, messages, reactions)
│   └── useSupabaseUserStatus.ts # User status/presence management
├── lib/                # Utility libraries
│   └── utils.ts        # Utility functions
├── constants/          # Application constants
│   └── index.ts        # Constants definitions
├── types/              # TypeScript type definitions
│   └── index.ts        # Type definitions
├── App.tsx             # Main application component
├── ErrorFallback.tsx   # Error boundary fallback
├── index.css           # Main styles and theme
├── main.css           # Structural CSS (do not edit)
├── main.tsx           # App entry point (do not edit)
└── vite-env.d.ts or vite-end.d.ts # Vite environment types (file name may vary)
```

## Component Architecture

### Core Components
- **App.tsx**: Main application orchestrator, manages global state and routing
- **Sidebar.tsx**: Channel navigation and user status
- **Header.tsx**: Search functionality and current channel display
- **MessagesView.tsx**: Message display and interaction handling
- **MessageInput.tsx**: Rich text message composition
- **ThreadView.tsx**: Thread/reply modal interface

### Supporting Components
- **MessageItem.tsx**: Individual message rendering with reactions
- **EmojiPicker.tsx**: Emoji selection interface
- **QuickSwitcher.tsx**: Fast channel switching modal
- **SettingsModal.tsx**: Theme and preferences configuration
- **StatusIndicator.tsx**: User online status display
- **KeyboardShortcutsHelp.tsx**: Keyboard shortcuts reference

## Data Management

### Hooks
- **useSupabaseData.ts**: Central data management for messages, channels, and reactions
- **useSupabaseUserStatus.ts**: User presence and status management via Supabase Presence
- **useSupabaseSettings.ts**: Theme and preferences with local caching (DB sync planned)
- **useKeyboardShortcuts.ts** / **useAppKeyboardShortcuts.ts**: Global keyboard shortcut handling

### Data Flow
1. Supabase is the source of truth for channels, messages, reactions, calls, and settings (enforced via RLS)
2. Real-time updates delivered through Supabase real-time subscriptions (WebSocket)
3. User status/presence synchronized via `useSupabaseUserStatus` and presence channels
4. Theme and UI preferences are cached locally for instant load and synchronized via `useSupabaseSettings`

## Styling & Theming

### CSS Architecture
- **index.css**: Theme variables, component styles, and responsive design
- **main.css**: Structural styles (managed by system, do not edit)
- **Tailwind CSS**: Utility-first styling approach
- **CSS Custom Properties**: Theme customization and dark mode support

### Theme System
- Light/dark mode toggle
- Multiple color theme options (orange, blue, green, purple, red)
- Consistent design tokens across components
- Responsive design for mobile and desktop

## Key Features

### Messaging
- Rich text formatting (bold, italic, strikethrough, code, quotes)
- Emoji reactions with user attribution
- Message threading/replies
- Message search with highlighting
- Real-time message updates

### Navigation
- Channel switching with unread message counts
- Keyboard shortcuts for power users
- Quick switcher for fast navigation
- Mobile-responsive sidebar

### User Experience
- User status indicators (active, away, busy)
- Theme customization
- Keyboard accessibility
- Mobile-optimized interface

## Development Guidelines

### Code Organization
- Components are single-responsibility and reusable
- Hooks manage specific domains of functionality
- Constants centralize configuration values
- Types provide comprehensive TypeScript coverage

### Best Practices
- Use Supabase hooks (`useSupabaseData`, `useSupabaseSettings`, `useSupabaseUserStatus`) for persistent data; use `useState` for local UI state
- Import paths use `@/` aliases for clean imports
- Components use shadcn UI library for consistency
- Error boundaries handle runtime failures gracefully

### Performance Considerations
- Efficient message rendering with proper React keys
- Optimized search with debounced input
- Lazy loading of emoji picker
- Minimal re-renders through proper state management