import { useState, useEffect, useCallback } from 'react'
import { useSupabaseData } from './useSupabaseData'
import { useAuth } from './useAuth'
import { Message, Channel, UserInfo, FileAttachment } from '@/types'

export const useSlackData = () => {
  const { user } = useAuth()
  const supabaseData = useSupabaseData(user)
  
  // Local state for when not authenticated
  const [localMessages, setLocalMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('slack-messages')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  
  const [localChannels, setLocalChannels] = useState<Channel[]>(() => {
    try {
      const stored = localStorage.getItem('slack-channels')
      return stored ? JSON.parse(stored) : [
        { id: 'general', name: 'general', description: 'General discussion' },
        { id: 'random', name: 'random', description: 'Random chatter' },
        { id: 'dev', name: 'dev', description: 'Development talk' }
      ]
    } catch {
      return [
        { id: 'general', name: 'general', description: 'General discussion' },
        { id: 'random', name: 'random', description: 'Random chatter' },
        { id: 'dev', name: 'dev', description: 'Development talk' }
      ]
    }
  })
  
  const [localLastReadTimestamps, setLocalLastReadTimestamps] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('last-read-timestamps')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const [localCurrentChannel, setLocalCurrentChannel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('current-channel')
      return stored || 'general'
    } catch {
      return 'general'
    }
  })

  // Save to localStorage when local state changes
  useEffect(() => {
    if (!user) {
      localStorage.setItem('slack-messages', JSON.stringify(localMessages))
    }
  }, [localMessages, user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem('slack-channels', JSON.stringify(localChannels))
    }
  }, [localChannels, user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem('last-read-timestamps', JSON.stringify(localLastReadTimestamps))
    }
  }, [localLastReadTimestamps, user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem('current-channel', localCurrentChannel)
    }
  }, [localCurrentChannel, user])

  // Use Supabase data if user is authenticated, otherwise use local data
  const messages = user ? supabaseData.messages : localMessages
  const channels = user ? supabaseData.channels : localChannels
  const lastReadTimestamps = user ? supabaseData.lastReadTimestamps : localLastReadTimestamps
  const currentChannel = user ? supabaseData.currentChannel : localCurrentChannel

  // Ensure we have fallback values
  const safeMessages = messages || []
  const safeChannels = channels || []
  const safeLastReadTimestamps = lastReadTimestamps || {}

  const markChannelAsRead = useCallback((channelId: string) => {
    if (user) {
      supabaseData.markChannelAsRead(channelId)
    } else {
      const now = Date.now()
      setLocalLastReadTimestamps((current) => ({
        ...(current || {}),
        [channelId]: now
      }))
    }
  }, [user, supabaseData])

  const sendMessage = useCallback((content: string, channelId?: string, threadId?: string, attachments?: FileAttachment[]) => {
    if (user) {
      return supabaseData.sendMessage(content, channelId, threadId, attachments)
    } else {
      // Local message handling for non-authenticated users
      try {
        if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) return
        
        const targetChannelId = channelId || localCurrentChannel
        if (!targetChannelId) return

        // Create anonymous user for local messages
        const anonymousUser = {
          id: 'anonymous',
          login: 'Anonymous',
          avatarUrl: '',
          email: '',
          isOwner: false
        }

        const newMessage: Message = {
          id: Date.now().toString(),
          content: content.trim(),
          userId: anonymousUser.id,
          userName: anonymousUser.login,
          userAvatar: anonymousUser.avatarUrl,
          timestamp: Date.now(),
          channelId: targetChannelId,
          ...(threadId && { threadId }),
          ...(attachments && attachments.length > 0 && { attachments })
        }

        setLocalMessages((current) => {
          const updatedMessages = [...(current || []), newMessage]
          
          // If this is a thread reply, update the parent message's reply count
          if (threadId) {
            return updatedMessages.map(msg => {
              if (msg.id === threadId) {
                return {
                  ...msg,
                  replyCount: (msg.replyCount || 0) + 1
                }
              }
              return msg
            })
          }
          
          return updatedMessages
        })
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }, [user, supabaseData, localCurrentChannel])

  const createChannel = useCallback((name: string) => {
    if (user) {
      return supabaseData.createChannel(name)
    } else {
      const channelId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      setLocalChannels((current) => [
        ...(current || []),
        {
          id: channelId,
          name: name,
          description: `${name} discussion`
        }
      ])
      
      return channelId
    }
  }, [user, supabaseData])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (user) {
      return supabaseData.addReaction(messageId, emoji)
    } else {
      // Local reaction handling for anonymous users
      const anonymousUser = {
        id: 'anonymous',
        login: 'Anonymous',
        avatarUrl: '',
        email: '',
        isOwner: false
      }

      setLocalMessages((current) => 
        (current || []).map(message => {
          if (message.id !== messageId) return message

          const reactions = message.reactions || []
          const existingReaction = reactions.find(r => r.emoji === emoji)

          if (existingReaction) {
            // If user already reacted with this emoji, remove their reaction
            if (existingReaction.users.includes(anonymousUser.id)) {
              const updatedUsers = existingReaction.users.filter(id => id !== anonymousUser.id)
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
              const updatedUsers = [...existingReaction.users, anonymousUser.id]
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
                  users: [anonymousUser.id],
                  count: 1
                }
              ]
            }
          }
        })
      )
    }
  }, [user, supabaseData])

  const updateChannel = useCallback((channelId: string, name: string, description: string) => {
    if (user) {
      return supabaseData.updateChannel(channelId, name, description)
    } else {
      setLocalChannels((current) => 
        (current || []).map(channel => 
          channel.id === channelId 
            ? { ...channel, name, description }
            : channel
        )
      )
    }
  }, [user, supabaseData])

  const deleteChannel = useCallback((channelId: string) => {
    if (user) {
      return supabaseData.deleteChannel(channelId)
    } else {
      // Don't allow deleting the general channel
      if (channelId === 'general') return

      // Remove the channel
      setLocalChannels((current) => (current || []).filter(channel => channel.id !== channelId))
      
      // Remove all messages from this channel
      setLocalMessages((current) => (current || []).filter(message => message.channelId !== channelId))
    }
  }, [user, supabaseData])

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (user) {
      return supabaseData.editMessage(messageId, newContent)
    } else {
      setLocalMessages((current) => 
        (current || []).map(message => {
          if (message.id === messageId && message.userId === 'anonymous') {
            return {
              ...message,
              content: newContent.trim(),
              edited: true,
              editedAt: Date.now()
            }
          }
          return message
        })
      )
    }
  }, [user, supabaseData])

  const deleteMessage = useCallback((messageId: string) => {
    if (user) {
      return supabaseData.deleteMessage(messageId)
    } else {
      setLocalMessages((current) => {
        const messageToDelete = (current || []).find(m => m.id === messageId)
        
        // Only allow deleting own messages
        if (!messageToDelete || messageToDelete.userId !== 'anonymous') return current || []
        
        // If this message has thread replies, we need to handle them
        const updatedMessages = (current || []).filter(message => {
          // Remove the main message
          if (message.id === messageId) return false
          
          // Remove thread replies to this message
          if (message.threadId === messageId) return false
          
          return true
        })
        
        // Update reply counts for any parent messages if this was a thread reply
        if (messageToDelete.threadId) {
          return updatedMessages.map(msg => {
            if (msg.id === messageToDelete.threadId) {
              return {
                ...msg,
                replyCount: Math.max((msg.replyCount || 1) - 1, 0)
              }
            }
            return msg
          })
        }
        
        return updatedMessages
      })
    }
  }, [user, supabaseData])

  const setCurrentChannel = useCallback((channelId: string) => {
    if (user) {
      supabaseData.setCurrentChannel(channelId)
    } else {
      setLocalCurrentChannel(channelId)
    }
  }, [user, supabaseData])

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
    markChannelAsRead,
    editMessage,
    deleteMessage
  }
}