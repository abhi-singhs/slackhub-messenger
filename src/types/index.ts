export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnail?: string // For images and videos
}

export interface Message {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string
  timestamp: number
  channelId: string
  reactions?: MessageReaction[]
  threadId?: string // Parent message ID if this is a thread reply
  replyCount?: number // Number of replies to this message
  attachments?: FileAttachment[] // File attachments
  edited?: boolean // Whether the message has been edited
  editedAt?: number // Timestamp when the message was last edited
}

export interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

export interface Channel {
  id: string
  name: string
  description?: string
}

export type UserStatus = 'active' | 'away' | 'busy'

export type NotificationSound = 'subtle' | 'classic' | 'modern' | 'none'

export interface NotificationSettings {
  // Sound settings
  soundEnabled: boolean
  soundVolume: number // 0-100
  soundType: NotificationSound
  
  // Desktop notifications
  desktopNotifications: boolean
  
  // Message notification triggers
  allMessages: boolean
  directMessages: boolean
  mentions: boolean
  keywords: string[]
  
  // Channel-specific settings
  channelSettings: Record<string, {
    muted: boolean
    customSound?: NotificationSound
  }>
  
  // Do not disturb
  doNotDisturb: boolean
  doNotDisturbUntil?: number // timestamp
  
  // Quiet hours
  quietHours: {
    enabled: boolean
    startTime: string // "22:00"
    endTime: string // "08:00"
  }
}

export interface UserInfo {
  id: string
  login: string
  avatarUrl: string
  email: string
  isOwner: boolean
  status?: UserStatus
}