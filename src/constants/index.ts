// Common emoji reactions for the picker
export const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😊', '😂', '😮', '😢', '😡',
  '🎉', '🔥', '👏', '💯', '✅', '❌', '⭐', '🚀'
]

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = [
  { key: 'Cmd/Ctrl + K', description: 'Quick channel switcher' },
  { key: 'Cmd/Ctrl + Shift + K', description: 'Show all channels' },
  { key: 'Cmd/Ctrl + /', description: 'Show keyboard shortcuts' },
  { key: 'Cmd/Ctrl + F', description: 'Search messages' },
  { key: 'Cmd/Ctrl + Enter', description: 'Send message' },
  { key: 'Alt + ↑/↓', description: 'Navigate channels' },
  { key: 'Cmd/Ctrl + Shift + T', description: 'Toggle sidebar' },
  { key: 'Cmd/Ctrl + Shift + A', description: 'Add reaction to last message' },
  { key: 'Cmd/Ctrl + Shift + R', description: 'Start thread on last message' },
  { key: 'Escape', description: 'Close modals/clear search' }
]

// Theme options
export const THEME_OPTIONS = [
  { value: 'orange', name: 'Orange', color: 'oklch(0.65 0.15 40)' },
  { value: 'blue', name: 'Blue', color: 'oklch(0.65 0.15 240)' },
  { value: 'green', name: 'Green', color: 'oklch(0.65 0.15 140)' },
  { value: 'purple', name: 'Purple', color: 'oklch(0.65 0.15 300)' },
  { value: 'red', name: 'Red', color: 'oklch(0.65 0.15 20)' }
] as const

// User status options
export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' }
] as const