// Application constants for better maintainability

// UI Constants
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const

export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500
} as const

export const SEARCH_CONFIG = {
  minQueryLength: 2,
  searchDelay: 300, // debounce delay in ms
  maxResults: 50
} as const

export const MESSAGE_CONFIG = {
  maxContentLength: 4000,
  maxAttachments: 10,
  maxAttachmentSize: 25 * 1024 * 1024, // 25MB
  editTimeLimit: 15 * 60 * 1000, // 15 minutes in ms
  scrollAnimationDuration: 500
} as const

export const NOTIFICATION_CONFIG = {
  defaultVolume: 70,
  maxVolume: 100,
  defaultTimeout: 5000
} as const

// Common emoji reactions for the picker
export const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😊', '😂', '😮', '😢', '😡',
  '🎉', '🔥', '👏', '💯', '✅', '❌', '⭐', '🚀'
] as const

// File type categories for attachments
export const FILE_TYPES = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  videos: ['mp4', 'webm', 'mov', 'avi'],
  audio: ['mp3', 'wav', 'ogg', 'flac'],
  documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  code: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md']
} as const

// Default channel data
export const DEFAULT_CHANNELS = [
  { id: 'general', name: 'general', description: 'General discussion' },
  { id: 'random', name: 'random', description: 'Random chat and off-topic discussions' }
] as const

// Error messages
export const ERROR_MESSAGES = {
  networkError: 'Network connection failed. Please check your internet connection.',
  authError: 'Authentication failed. Please log in again.',
  uploadError: 'File upload failed. Please try again.',
  messageTooLong: `Message is too long. Maximum length is ${MESSAGE_CONFIG.maxContentLength} characters.`,
  fileTooLarge: `File is too large. Maximum size is ${MESSAGE_CONFIG.maxAttachmentSize / (1024 * 1024)}MB.`,
  tooManyAttachments: `Too many attachments. Maximum is ${MESSAGE_CONFIG.maxAttachments} files.`,
  editTimeExpired: 'Cannot edit message. Edit time limit has expired.',
  invalidChannel: 'Invalid channel selected.',
  callFailed: 'Call failed to start. Please try again.'
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  messageSent: 'Message sent successfully',
  channelCreated: 'Channel created successfully',
  channelDeleted: 'Channel deleted successfully',
  reactionAdded: 'Reaction added',
  fileUploaded: 'File uploaded successfully',
  settingsSaved: 'Settings saved successfully'
} as const

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

// Notification sound options
export const NOTIFICATION_SOUNDS = [
  { value: 'none', label: 'None', description: 'No sound' },
  { value: 'subtle', label: 'Subtle', description: 'Gentle two-tone chime' },
  { value: 'classic', label: 'Classic', description: 'Traditional beep' },
  { value: 'modern', label: 'Modern', description: 'Tech-style sweep' }
] as const