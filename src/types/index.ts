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

export interface UserInfo {
  id: string
  login: string
  avatarUrl: string
  email: string
  isOwner: boolean
  status?: UserStatus
}