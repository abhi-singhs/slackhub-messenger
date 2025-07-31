import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo, Message, Channel } from '@/types'
import { toast } from 'sonner'

interface RealtimeNotificationsOptions {
  user: UserInfo | null
  currentChannel: string
  channels: Channel[]
  notificationSettings?: {
    soundEnabled: boolean
    desktopNotifications: boolean
    allMessages: boolean
    directMessages: boolean
    mentions: boolean
    keywords: string[]
  }
}

export const useRealtimeNotifications = ({
  user,
  currentChannel,
  channels,
  notificationSettings
}: RealtimeNotificationsOptions) => {
  
  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!notificationSettings?.soundEnabled) return
    
    try {
      const audio = new Audio('/notification.mp3') // You would need to add this file to public folder
      audio.volume = 0.3
      audio.play().catch(console.warn) // Catch potential autoplay policy errors
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }, [notificationSettings?.soundEnabled])

  // Show desktop notification
  const showDesktopNotification = useCallback((title: string, body: string, avatar?: string) => {
    if (!notificationSettings?.desktopNotifications) return
    
    // Request permission if not already granted
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: avatar || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'slack-clone-message' // This replaces previous notifications
      })
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000)
    }
  }, [notificationSettings?.desktopNotifications])

  // Check if message should trigger notification
  const shouldNotify = useCallback((message: any) => {
    if (!user || !notificationSettings) return false
    
    // Don't notify for own messages
    if (message.user_id === user.id) return false
    
    // Don't notify if user is currently in the channel and window is focused
    if (message.channel_id === currentChannel && !document.hidden) return false
    
    // Check various notification settings
    const { allMessages, directMessages, mentions, keywords } = notificationSettings
    
    // Check for direct messages (if this were implemented)
    if (directMessages && message.channel_id?.startsWith('dm-')) {
      return true
    }
    
    // Check for mentions
    if (mentions && message.content?.includes(`@${user.login}`)) {
      return true
    }
    
    // Check for keywords
    if (keywords && keywords.length > 0) {
      const messageContent = message.content?.toLowerCase() || ''
      for (const keyword of keywords) {
        if (messageContent.includes(keyword.toLowerCase())) {
          return true
        }
      }
    }
    
    // Check for all messages setting
    if (allMessages) {
      return true
    }
    
    return false
  }, [user, currentChannel, notificationSettings])

  // Set up realtime notifications for new messages
  useEffect(() => {
    if (!user) return

    console.log('🔔 Setting up realtime notifications')

    const subscription = supabase
      .channel('message-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMessage = payload.new
          
          if (shouldNotify(newMessage)) {
            // Get channel info for notification
            const channel = channels.find(c => c.id === newMessage.channel_id)
            const channelName = channel?.name || 'Unknown Channel'
            
            // Get user info for the sender
            const { data: senderData } = await supabase
              .from('users')
              .select('username, avatar_url')
              .eq('id', newMessage.user_id)
              .single()
            
            const senderName = senderData?.username || 'Unknown User'
            const senderAvatar = senderData?.avatar_url
            
            // Create notification content
            const title = `#${channelName}`
            const body = `${senderName}: ${newMessage.content.substring(0, 100)}${newMessage.content.length > 100 ? '...' : ''}`
            
            // Show notifications
            playNotificationSound()
            showDesktopNotification(title, body, senderAvatar)
            
            // Show toast notification (always show these regardless of settings)
            toast.info(`New message in #${channelName}`, {
              description: `${senderName}: ${newMessage.content.substring(0, 80)}${newMessage.content.length > 80 ? '...' : ''}`,
              duration: 4000
            })
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔔 Cleaning up notification subscription')
      supabase.removeChannel(subscription)
    }
  }, [user, channels, shouldNotify, playNotificationSound, showDesktopNotification])

  // Set up realtime notifications for mentions and reactions
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('reaction-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        async (payload) => {
          const newReaction = payload.new
          
          // Get the message that was reacted to
          const { data: messageData } = await supabase
            .from('messages')
            .select('user_id, content, channel_id')
            .eq('id', newReaction.message_id)
            .single()
          
          // Only notify if it's a reaction to current user's message
          if (messageData?.user_id === user.id && newReaction.user_id !== user.id) {
            // Get reactor info
            const { data: reactorData } = await supabase
              .from('users')
              .select('username')
              .eq('id', newReaction.user_id)
              .single()
            
            // Get channel info
            const channel = channels.find(c => c.id === messageData.channel_id)
            const channelName = channel?.name || 'Unknown Channel'
            
            const reactorName = reactorData?.username || 'Someone'
            
            toast.info(`${reactorName} reacted with ${newReaction.emoji}`, {
              description: `To your message in #${channelName}`,
              duration: 3000
            })
            
            playNotificationSound()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, channels, playNotificationSound])

  return {
    playNotificationSound,
    showDesktopNotification
  }
}
