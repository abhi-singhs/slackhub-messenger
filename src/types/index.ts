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

export interface UserInfo {
  id: string
  login: string
  avatarUrl: string
  email: string
  isOwner: boolean
}