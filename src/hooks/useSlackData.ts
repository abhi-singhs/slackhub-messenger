import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Message, Channel, UserInfo } from '@/types'

declare const spark: Window['spark']

export const useSlackData = () => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [currentChannel, setCurrentChannel] = useState<string>('')
  
  const [messages, setMessages] = useKV<Message[]>('slack-messages', [])
  const [channels, setChannels] = useKV<Channel[]>('slack-channels', [
    { id: 'general', name: 'general', description: 'General discussion' },
    { id: 'random', name: 'random', description: 'Random chatter' },
    { id: 'dev', name: 'dev', description: 'Development talk' }
  ])
  const [lastReadTimestamps, setLastReadTimestamps] = useKV<Record<string, number>>('last-read-timestamps', {})

  // Ensure we have fallback values
  const safeMessages = messages || []
  const safeChannels = channels || []
  const safeLastReadTimestamps = lastReadTimestamps || {}

  const markChannelAsRead = useCallback((channelId: string) => {
    const now = Date.now()
    setLastReadTimestamps((current) => ({
      ...(current || {}),
      [channelId]: now
    }))
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await spark.user()
        if (userData) {
          setUser({
            id: userData.id.toString(),
            login: userData.login || 'Anonymous',
            avatarUrl: userData.avatarUrl || '',
            email: userData.email || '',
            isOwner: userData.isOwner || false
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        console.log('Using anonymous user')
        setUser({
          id: 'anonymous',
          login: 'Anonymous',
          avatarUrl: '',
          email: '',
          isOwner: false
        })
      }
    }
    fetchUser()
  }, [])

  // Don't auto-mark channels as read here - let App.tsx handle it when route changes

  const sendMessage = useCallback((content: string, channelId?: string) => {
    try {
      if (!content.trim() || !user) return

      // Use provided channelId or fall back to currentChannel
      const targetChannelId = channelId || currentChannel
      if (!targetChannelId) return

      const newMessage: Message = {
        id: Date.now().toString(),
        content: content.trim(),
        userId: user.id,
        userName: user.login,
        userAvatar: user.avatarUrl,
        timestamp: Date.now(),
        channelId: targetChannelId
      }

      setMessages((current) => [...(current || []), newMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [user, currentChannel])

  const createChannel = useCallback((name: string) => {
    const channelId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    setChannels((current) => [
      ...(current || []),
      {
        id: channelId,
        name: name,
        description: `${name} discussion`
      }
    ])
    
    return channelId
  }, [])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!user) return

    setMessages((current) => 
      (current || []).map(message => {
        if (message.id !== messageId) return message

        const reactions = message.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)

        if (existingReaction) {
          // If user already reacted with this emoji, remove their reaction
          if (existingReaction.users.includes(user.id)) {
            const updatedUsers = existingReaction.users.filter(id => id !== user.id)
            if (updatedUsers.length === 0) {
              // Remove the reaction entirely if no users left
              return {
                ...message,
                reactions: reactions.filter(r => r.emoji !== emoji)
              }
            } else {
              // Update the reaction with fewer users
              return {
                ...message,
                reactions: reactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, users: updatedUsers, count: updatedUsers.length }
                    : r
                )
              }
            }
          } else {
            // Add user to existing reaction
            const updatedUsers = [...existingReaction.users, user.id]
            return {
              ...message,
              reactions: reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, users: updatedUsers, count: updatedUsers.length }
                  : r
              )
            }
          }
        } else {
          // Create new reaction
          return {
            ...message,
            reactions: [
              ...reactions,
              {
                emoji,
                users: [user.id],
                count: 1
              }
            ]
          }
        }
      })
    )
  }, [user])

  const updateChannel = useCallback((channelId: string, name: string, description: string) => {
    setChannels((current) => 
      (current || []).map(channel => 
        channel.id === channelId 
          ? { ...channel, name, description }
          : channel
      )
    )
  }, [])

  const deleteChannel = useCallback((channelId: string) => {
    // Don't allow deleting the general channel
    if (channelId === 'general') return

    // Remove the channel
    setChannels((current) => (current || []).filter(channel => channel.id !== channelId))
    
    // Remove all messages from this channel
    setMessages((current) => (current || []).filter(message => message.channelId !== channelId))
  }, [])

  return {
    user,
    currentChannel,
    setCurrentChannel,
    messages: safeMessages,
    channels: safeChannels,
    lastReadTimestamps: safeLastReadTimestamps,
    sendMessage,
    createChannel,
    updateChannel,
    deleteChannel,
    addReaction,
    markChannelAsRead
  }
}