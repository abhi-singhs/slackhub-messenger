export interface Message {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string
  timestamp: number
  channelId: string
  reactions?: MessageReaction[]
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