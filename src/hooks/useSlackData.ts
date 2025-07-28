import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Message, Channel, UserInfo } from '@/types'

export const useSlackData = () => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [currentChannel, setCurrentChannel] = useState<string>('general')
  
  const [messages, setMessages] = useKV<Message[]>('slack-messages', [])
  const [channels, setChannels] = useKV<Channel[]>('slack-channels', [
    { id: 'general', name: 'general', description: 'General discussion' },
    { id: 'random', name: 'random', description: 'Random chatter' },
    { id: 'dev', name: 'dev', description: 'Development talk' }
  ])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await spark.user()
        setUser(userData)
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

  const sendMessage = (content: string) => {
    try {
      if (!content.trim() || !user) return

      const newMessage: Message = {
        id: Date.now().toString(),
        content: content.trim(),
        userId: user.id,
        userName: user.login,
        userAvatar: user.avatarUrl,
        timestamp: Date.now(),
        channelId: currentChannel
      }

      setMessages((current) => [...current, newMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const createChannel = (name: string) => {
    const channelId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    setChannels((current) => [
      ...current,
      {
        id: channelId,
        name: name,
        description: `${name} discussion`
      }
    ])
    
    setCurrentChannel(channelId)
  }

  const addReaction = (messageId: string, emoji: string) => {
    if (!user) return

    setMessages((current) => 
      current.map(message => {
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
  }

  return {
    user,
    currentChannel,
    setCurrentChannel,
    messages,
    channels,
    sendMessage,
    createChannel,
    addReaction
  }
}