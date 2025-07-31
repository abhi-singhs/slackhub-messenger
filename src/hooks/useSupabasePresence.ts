import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo, UserStatus } from '@/types'

interface PresenceUser {
  userId: string
  userName: string
  userAvatar: string
  status: UserStatus
  lastSeen: number
}

interface PresencePayload {
  userId: string
  userName: string
  userAvatar: string
  status: UserStatus
  lastSeen: number
}

export const useSupabasePresence = (user: UserInfo | null, currentChannel?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [channelPresence, setChannelPresence] = useState<Record<string, PresenceUser[]>>({})

  // Join channel presence
  const joinChannelPresence = useCallback(async (channelId: string) => {
    if (!user || !channelId) return

    const channel = supabase.channel(`channel-${channelId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    // Track when users join/leave the channel
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('👥 Channel presence synced')
        const presenceState = channel.presenceState()
        const users: PresenceUser[] = []
        
        for (const userId in presenceState) {
          const presence = presenceState[userId][0] as unknown as PresencePayload // Type assertion
          if (presence && presence.userId) {
            users.push({
              userId: presence.userId,
              userName: presence.userName,
              userAvatar: presence.userAvatar,
              status: presence.status,
              lastSeen: presence.lastSeen
            })
          }
        }
        
        setChannelPresence(prev => ({
          ...prev,
          [channelId]: users
        }))
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👥 User joined channel:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👥 User left channel:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send current user presence
          await channel.track({
            userId: user.id,
            userName: user.login,
            userAvatar: user.avatarUrl,
            status: user.status || 'active',
            lastSeen: Date.now()
          })
        }
      })

    return channel
  }, [user])

  // Leave channel presence
  const leaveChannelPresence = useCallback(async (channelId: string) => {
    if (!channelId) return
    
    const channel = supabase.getChannels().find(ch => ch.topic === `channel-${channelId}`)
    if (channel) {
      await channel.unsubscribe()
    }
    
    setChannelPresence(prev => {
      const updated = { ...prev }
      delete updated[channelId]
      return updated
    })
  }, [])

  // Update user presence
  const updatePresence = useCallback(async (status: UserStatus) => {
    if (!user || !currentChannel) return

    const channel = supabase.getChannels().find(ch => ch.topic === `channel-${currentChannel}`)
    if (channel) {
      await channel.track({
        userId: user.id,
        userName: user.login,
        userAvatar: user.avatarUrl,
        status,
        lastSeen: Date.now()
      })
    }
  }, [user, currentChannel])

  // Global presence tracking for all users
  useEffect(() => {
    if (!user) return

    const globalChannel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    globalChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('🌍 Global presence synced')
        const presenceState = globalChannel.presenceState()
        const users: PresenceUser[] = []
        
        for (const userId in presenceState) {
          const presence = presenceState[userId][0] as unknown as PresencePayload // Type assertion
          if (presence && presence.userId && presence.userId !== user.id) { // Exclude current user
            users.push({
              userId: presence.userId,
              userName: presence.userName,
              userAvatar: presence.userAvatar,
              status: presence.status,
              lastSeen: presence.lastSeen
            })
          }
        }
        
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send current user presence
          await globalChannel.track({
            userId: user.id,
            userName: user.login,
            userAvatar: user.avatarUrl,
            status: user.status || 'active',
            lastSeen: Date.now()
          })
        }
      })

    return () => {
      globalChannel.unsubscribe()
    }
  }, [user])

  // Join current channel presence
  useEffect(() => {
    if (!currentChannel) return

    let channelSubscription: any

    const setupPresence = async () => {
      channelSubscription = await joinChannelPresence(currentChannel)
    }

    setupPresence()

    return () => {
      if (channelSubscription) {
        channelSubscription.unsubscribe()
      }
    }
  }, [currentChannel, joinChannelPresence])

  return {
    onlineUsers,
    channelPresence,
    joinChannelPresence,
    leaveChannelPresence,
    updatePresence
  }
}
