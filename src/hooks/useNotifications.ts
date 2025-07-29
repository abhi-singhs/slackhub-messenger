import { useEffect, useRef, useCallback } from 'react'
import { useSettings } from './useSettings'
import { Message, UserInfo, Channel, NotificationSound } from '@/types'

// Web Audio API based sound generation for different notification types
const createAudioContext = () => {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  return AudioContext ? new AudioContext() : null
}

const playNotificationSound = async (soundType: NotificationSound, volume: number) => {
  if (soundType === 'none' || volume === 0) return
  
  const audioContext = createAudioContext()
  if (!audioContext) return

  try {
    // Resume audio context if it's suspended (required by browsers for user interaction)
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Set volume (convert from 0-100 to 0-1)
    gainNode.gain.setValueAtTime(volume / 100 * 0.3, audioContext.currentTime)
    
    // Different sound patterns for different types
    const now = audioContext.currentTime
    
    switch (soundType) {
      case 'subtle':
        // Gentle two-tone chime
        oscillator.frequency.setValueAtTime(800, now)
        oscillator.frequency.setValueAtTime(600, now + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        break
        
      case 'classic':
        // Traditional notification beep
        oscillator.frequency.setValueAtTime(1000, now)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        break
        
      case 'modern':
        // Modern tech sound with frequency sweep
        oscillator.frequency.setValueAtTime(600, now)
        oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.1)
        oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.2)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
        break
    }
    
    oscillator.type = 'sine'
    oscillator.start(now)
    oscillator.stop(now + 0.3)
    
    // Clean up
    setTimeout(() => {
      audioContext.close()
    }, 500)
    
  } catch (error) {
    console.warn('Failed to play notification sound:', error)
  }
}

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

const isQuietHours = (quietHours: { enabled: boolean; startTime: string; endTime: string }): boolean => {
  if (!quietHours.enabled) return false
  
  const now = new Date()
  const currentTime = now.getHours() * 100 + now.getMinutes()
  
  const [startHour, startMin] = quietHours.startTime.split(':').map(Number)
  const [endHour, endMin] = quietHours.endTime.split(':').map(Number)
  
  const startTime = startHour * 100 + startMin
  const endTime = endHour * 100 + endMin
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime
  }
  
  return currentTime >= startTime && currentTime <= endTime
}

const shouldNotifyForMessage = (
  message: Message,
  user: UserInfo,
  notifications: Settings['notifications'],
  channels: Channel[]
): boolean => {
  // Don't notify for own messages
  if (message.userId === user.id) return false
  
  // Check do not disturb
  if (notifications.doNotDisturb) return false
  
  // Check if it's within do not disturb period
  if (notifications.doNotDisturbUntil && Date.now() < notifications.doNotDisturbUntil) {
    return false
  }
  
  // Check quiet hours
  if (isQuietHours(notifications.quietHours)) return false
  
  // Check channel-specific settings
  const channelSettings = notifications.channelSettings[message.channelId]
  if (channelSettings?.muted) return false
  
  // Check if it's a direct message (in a DM channel)
  const channel = channels.find(c => c.id === message.channelId)
  const isDM = channel?.name.startsWith('@') || false
  
  if (isDM && notifications.directMessages) return true
  
  // Check for mentions (simplified - looking for @username in message)
  const isMentioned = message.content.toLowerCase().includes(`@${user.login.toLowerCase()}`)
  if (isMentioned && notifications.mentions) return true
  
  // Check for keywords
  const hasKeyword = notifications.keywords.some(keyword => 
    keyword.length > 0 && message.content.toLowerCase().includes(keyword.toLowerCase())
  )
  if (hasKeyword) return true
  
  // Check if all messages are enabled
  if (notifications.allMessages) return true
  
  return false
}

export const useNotifications = (
  user: UserInfo | null,
  channels: Channel[],
  messages: Message[]
) => {
  const { settings } = useSettings()
  const { notifications } = settings
  const lastMessageCountRef = useRef(0)
  const hasPermissionRef = useRef(false)
  
  // Request notification permission on mount
  useEffect(() => {
    if (notifications.desktopNotifications) {
      requestNotificationPermission().then(granted => {
        hasPermissionRef.current = granted
      })
    }
  }, [notifications.desktopNotifications])
  
  // Monitor new messages and trigger notifications
  useEffect(() => {
    if (!user || !messages || messages.length === 0) return
    
    const newMessages = messages.slice(lastMessageCountRef.current)
    lastMessageCountRef.current = messages.length
    
    // Don't notify on initial load
    if (lastMessageCountRef.current === messages.length && newMessages.length === messages.length) {
      return
    }
    
    newMessages.forEach(message => {
      if (shouldNotifyForMessage(message, user, notifications, channels)) {
        handleNotification(message, channels)
      }
    })
  }, [messages, user, notifications, channels])
  
  const handleNotification = useCallback(async (message: Message, channels: Channel[]) => {
    const channel = channels.find(c => c.id === message.channelId)
    const channelSettings = notifications.channelSettings[message.channelId]
    
    // Play sound notification
    if (notifications.soundEnabled) {
      const soundType = channelSettings?.customSound || notifications.soundType
      await playNotificationSound(soundType, notifications.soundVolume)
    }
    
    // Show desktop notification
    if (notifications.desktopNotifications && hasPermissionRef.current) {
      const channelName = channel?.name || 'Unknown Channel'
      const title = `${message.userName} in #${channelName}`
      const body = message.content.length > 100 
        ? message.content.substring(0, 100) + '...'
        : message.content
      
      try {
        const notification = new Notification(title, {
          body,
          icon: message.userAvatar,
          tag: `message-${message.id}`,
          requireInteraction: false
        })
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)
        
        // Handle click to focus the app
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.warn('Failed to show desktop notification:', error)
      }
    }
  }, [notifications])
  
  const testNotificationSound = useCallback(async (soundType: NotificationSound, volume: number) => {
    await playNotificationSound(soundType, volume)
  }, [])
  
  const testDesktopNotification = useCallback(async () => {
    const hasPermission = await requestNotificationPermission()
    if (hasPermission) {
      new Notification('Test Notification', {
        body: 'This is how notifications will appear.',
        icon: user?.avatarUrl,
        tag: 'test-notification',
        requireInteraction: false
      })
    }
    return hasPermission
  }, [user])
  
  return {
    testNotificationSound,
    testDesktopNotification,
    hasNotificationPermission: hasPermissionRef.current
  }
}