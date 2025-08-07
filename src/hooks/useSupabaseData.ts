import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Message, Channel, UserInfo, FileAttachment, MessageReaction } from '@/types'

export const useSupabaseData = (user: UserInfo | null) => {
  const [currentChannel, setCurrentChannel] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    console.log('📁 Fetching channels...')
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Channels fetch timeout')), 10000)
      )
      
      const queryPromise = supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error) throw error

      console.log('📁 Channels fetched:', data?.length || 0)
      const formattedChannels: Channel[] = data.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || ''
      }))

      setChannels(formattedChannels)
    } catch (error) {
      console.error('❌ Error fetching channels:', error)
      // Set default channels if fetching fails
      console.log('🔧 Setting default channels')
      setChannels([
        { id: 'general', name: 'general', description: 'General discussion' }
      ])
    }
  }, [])

  // Fetch messages with their reactions
  const fetchMessages = useCallback(async () => {
    console.log('💬 Fetching messages...')
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Messages fetch timeout')), 15000)
      )
      
      // Fetch messages with user profiles
      const queryPromise = supabase
        .from('messages')
        .select(`
          *,
          users(id, username, avatar_url)
        `)
        .order('created_at', { ascending: true })

      const { data: messagesData, error: messagesError } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (messagesError) throw messagesError
      console.log('💬 Messages fetched:', messagesData?.length || 0)
      
      // Skip reactions if no messages
      if (!messagesData || messagesData.length === 0) {
        setMessages([])
        return
      }
      
      // Fetch reactions for all messages
      const messageIds = messagesData.map(m => m.id)
      let reactionsData: any[] = []
      
      try {
        const { data, error: reactionsError } = await supabase
          .from('reactions')
          .select('*')
          .in('message_id', messageIds)

        if (reactionsError) {
          console.warn('Error fetching reactions:', reactionsError)
          // Continue without reactions rather than failing
        } else {
          reactionsData = data || []
        }
      } catch (error) {
        console.warn('Failed to fetch reactions, continuing without them:', error)
      }

      // Group reactions by message and emoji
      const reactionsByMessage: Record<string, MessageReaction[]> = {}
      reactionsData.forEach(reaction => {
        if (!reactionsByMessage[reaction.message_id]) {
          reactionsByMessage[reaction.message_id] = []
        }

        const existingReaction = reactionsByMessage[reaction.message_id].find(r => r.emoji === reaction.emoji)
        if (existingReaction) {
          existingReaction.users.push(reaction.user_id)
          existingReaction.count += 1
        } else {
          reactionsByMessage[reaction.message_id].push({
            emoji: reaction.emoji,
            users: [reaction.user_id],
            count: 1
          })
        }
      })

      // Format messages
      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        content: msg.content,
        userId: msg.user_id,
        userName: msg.users?.username || 'Unknown',
        userAvatar: msg.users?.avatar_url || '',
        timestamp: new Date(msg.created_at).getTime(),
        channelId: msg.channel_id,
        threadId: msg.thread_id || undefined,
        attachments: msg.attachments || undefined,
        edited: msg.edited,
        editedAt: msg.edited_at ? new Date(msg.edited_at).getTime() : undefined,
        reactions: reactionsByMessage[msg.id] || undefined,
        replyCount: 0 // Will be calculated separately if needed
      }))

      // Calculate reply counts
      const threadCounts: Record<string, number> = {}
      formattedMessages.forEach(msg => {
        if (msg.threadId) {
          threadCounts[msg.threadId] = (threadCounts[msg.threadId] || 0) + 1
        }
      })

      // Add reply counts to parent messages
      const messagesWithReplyCounts = formattedMessages.map(msg => ({
        ...msg,
        replyCount: threadCounts[msg.id] || 0
      }))

      setMessages(messagesWithReplyCounts)
    } catch (error) {
      console.error('Error fetching messages:', error)
      // Set empty messages array to prevent hanging
      setMessages([])
    }
  }, [])

  // Load last read timestamps from localStorage
  const loadLastReadTimestamps = useCallback(() => {
    if (!user) return

    try {
      const stored = localStorage.getItem(`last-read-timestamps-${user.id}`)
      if (stored) {
        const timestamps = JSON.parse(stored)
        setLastReadTimestamps(timestamps)
        console.log('🔄 Loaded last read timestamps from localStorage:', timestamps)
      }
    } catch (error) {
      console.error('❌ Error loading last read timestamps from localStorage:', error)
    }
  }, [user])

  // Save last read timestamps to localStorage
  const saveLastReadTimestamps = useCallback((timestamps: Record<string, number>) => {
    if (!user) return

    try {
      localStorage.setItem(`last-read-timestamps-${user.id}`, JSON.stringify(timestamps))
      console.log('✅ Saved last read timestamps to localStorage:', timestamps)
    } catch (error) {
      console.error('❌ Error saving last read timestamps to localStorage:', error)
    }
  }, [user])

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Starting data load, user:', user?.id)
      
      if (!user) {
        console.log('❌ No user, setting loading to false')
        setLoading(false)
        return
      }

      setLoading(true)
      console.log('🔄 Loading set to true, starting fetch operations...')
      
      try {
        console.log('📡 Starting Promise.all for data fetching...')
        // Add overall timeout to prevent infinite loading
        const loadingPromise = Promise.all([
          fetchChannels(),
          fetchMessages()
        ])
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Overall loading timeout')), 30000)
        )
        
        await Promise.race([loadingPromise, timeoutPromise])
        
        // Load last read timestamps from localStorage
        loadLastReadTimestamps()
        
        console.log('✅ All data fetched successfully')
      } catch (error) {
        console.error('❌ Error loading data:', error)
        // Set default data so the app can still function
        console.log('🔧 Setting default data to recover from error')
        setChannels([
          { id: 'general', name: 'general', description: 'General discussion' }
        ])
        setCurrentChannel('general')
      } finally {
        console.log('🏁 Setting loading to false')
        setLoading(false)
      }
    }

    loadData()
  }, [user]) // Only user dependency - callbacks have stable references via useCallback with empty deps

  // Set initial channel when channels are loaded
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      const generalChannel = channels.find(c => c.name === 'general') || channels[0]
      setCurrentChannel(generalChannel.id)
    }
  }, [channels, currentChannel])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    console.log('🔄 Setting up real-time subscriptions')

    // Create stable references to avoid stale closures
    const refetchChannels = () => {
      console.log('📁 Channel change detected, refetching...')
      fetchChannels().catch(console.error)
    }

    const refetchMessages = () => {
      console.log('� Message/reaction change detected, refetching...')
      fetchMessages().catch(console.error)
    }

    // Subscribe to channel changes with optimistic updates
    const channelsSubscription = supabase
      .channel('channels-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'channels' },
        (payload) => {
          console.log('📁 New channel created:', payload.new)
          const newChannel: Channel = {
            id: payload.new.id,
            name: payload.new.name,
            description: payload.new.description || ''
          }
          setChannels(prevChannels => [...prevChannels, newChannel])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channels' },
        (payload) => {
          console.log('📁 Channel updated:', payload.new)
          setChannels(prevChannels => 
            prevChannels.map(channel => 
              channel.id === payload.new.id 
                ? { 
                    ...channel, 
                    name: payload.new.name, 
                    description: payload.new.description || '' 
                  }
                : channel
            )
          )
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'channels' },
        (payload) => {
          console.log('📁 Channel deleted:', payload.old)
          setChannels(prevChannels => 
            prevChannels.filter(channel => channel.id !== payload.old.id)
          )
          // Switch to general channel if current channel was deleted
          if (currentChannel === payload.old.id) {
            const generalChannel = channels.find(c => c.name === 'general')
            if (generalChannel) {
              setCurrentChannel(generalChannel.id)
            }
          }
        }
      )
      .subscribe()

    // Subscribe to message changes with optimistic updates
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          console.log('💬 New message received:', payload.new)
          
          // Fetch user data for the message
          const { data: userData } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            userId: payload.new.user_id,
            userName: userData?.username || 'Unknown',
            userAvatar: userData?.avatar_url || '',
            timestamp: new Date(payload.new.created_at).getTime(),
            channelId: payload.new.channel_id,
            threadId: payload.new.thread_id || undefined,
            attachments: payload.new.attachments || undefined,
            edited: payload.new.edited || false,
            editedAt: payload.new.edited_at ? new Date(payload.new.edited_at).getTime() : undefined,
            replyCount: 0
          }

          setMessages(prevMessages => {
            // Check if message already exists (to avoid duplicates from optimistic updates)
            if (prevMessages.some(msg => msg.id === newMessage.id)) {
              return prevMessages.map(msg => msg.id === newMessage.id ? newMessage : msg)
            }
            
            const newMessages = [...prevMessages, newMessage]
            
            // If this is a thread reply, update parent message reply count
            if (payload.new.thread_id) {
              return newMessages.map(msg => {
                if (msg.id === payload.new.thread_id) {
                  return { ...msg, replyCount: (msg.replyCount || 0) + 1 }
                }
                return msg
              })
            }
            
            return newMessages
          })
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('💬 Message updated:', payload.new)
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === payload.new.id 
                ? {
                    ...msg,
                    content: payload.new.content,
                    edited: payload.new.edited || false,
                    editedAt: payload.new.edited_at ? new Date(payload.new.edited_at).getTime() : undefined
                  }
                : msg
            )
          )
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('💬 Message deleted:', payload.old)
          setMessages(prevMessages => {
            const filteredMessages = prevMessages.filter(msg => {
              // Remove the main message
              if (msg.id === payload.old.id) return false
              // Remove thread replies to this message
              if (msg.threadId === payload.old.id) return false
              return true
            })

            // Update reply counts for parent messages if this was a thread reply
            if (payload.old.thread_id) {
              return filteredMessages.map(msg => {
                if (msg.id === payload.old.thread_id) {
                  return { ...msg, replyCount: Math.max((msg.replyCount || 1) - 1, 0) }
                }
                return msg
              })
            }

            return filteredMessages
          })
        }
      )
      .subscribe()

    // Subscribe to reaction changes with optimistic updates
    const reactionsSubscription = supabase
      .channel('reactions-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        async (payload) => {
          console.log('👍 New reaction added:', payload.new)
          
          // Fetch user data for the reaction
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', payload.new.user_id)
            .single()

          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (msg.id === payload.new.message_id) {
                const reactions = msg.reactions || []
                const existingReactionIndex = reactions.findIndex(r => r.emoji === payload.new.emoji)
                
                if (existingReactionIndex !== -1) {
                  // Add to existing reaction
                  const updatedReaction = { ...reactions[existingReactionIndex] }
                  updatedReaction.users = [...updatedReaction.users, userData?.username || 'Unknown']
                  updatedReaction.count = updatedReaction.count + 1
                  
                  const newReactions = [...reactions]
                  newReactions[existingReactionIndex] = updatedReaction
                  return { ...msg, reactions: newReactions }
                } else {
                  // Create new reaction
                  const newReaction: MessageReaction = {
                    emoji: payload.new.emoji,
                    count: 1,
                    users: [userData?.username || 'Unknown']
                  }
                  return { ...msg, reactions: [...reactions, newReaction] }
                }
              }
              return msg
            })
          )
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reactions' },
        async (payload) => {
          console.log('👍 Reaction removed:', payload.old)
          
          // Fetch user data for the reaction
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', payload.old.user_id)
            .single()

          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (msg.id === payload.old.message_id) {
                const reactions = msg.reactions || []
                const existingReactionIndex = reactions.findIndex(r => r.emoji === payload.old.emoji)
                
                if (existingReactionIndex !== -1) {
                  const updatedReaction = { ...reactions[existingReactionIndex] }
                  updatedReaction.users = updatedReaction.users.filter(user => user !== (userData?.username || 'Unknown'))
                  updatedReaction.count = Math.max(updatedReaction.count - 1, 0)
                  
                  if (updatedReaction.count === 0) {
                    // Remove reaction entirely if count reaches 0
                    const newReactions = reactions.filter((_, index) => index !== existingReactionIndex)
                    return { ...msg, reactions: newReactions }
                  } else {
                    const newReactions = [...reactions]
                    newReactions[existingReactionIndex] = updatedReaction
                    return { ...msg, reactions: newReactions }
                  }
                }
              }
              return msg
            })
          )
        }
      )
      .subscribe()

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions')
      supabase.removeChannel(channelsSubscription)
      supabase.removeChannel(messagesSubscription)
      supabase.removeChannel(reactionsSubscription)
    }
  }, [user, currentChannel]) // Remove channels from deps to prevent infinite loop

  const markChannelAsRead = useCallback(async (channelId: string) => {
    if (!user) return

    const now = Date.now()
    const newTimestamps = {
      ...lastReadTimestamps,
      [channelId]: now
    }

    // Update local state
    setLastReadTimestamps(newTimestamps)
    
    // Save to localStorage
    saveLastReadTimestamps(newTimestamps)
    
    console.log('✅ Marked channel as read:', channelId, 'at', new Date(now).toISOString())
  }, [user, lastReadTimestamps, saveLastReadTimestamps])

  const sendMessage = useCallback(async (
    content: string, 
    channelId?: string, 
    threadId?: string, 
    attachments?: FileAttachment[]
  ) => {
    if (!user || (!content.trim() && (!attachments || attachments.length === 0))) return

    const targetChannelId = channelId || currentChannel
    if (!targetChannelId) return

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      userId: user.id,
      userName: user.login,
      userAvatar: user.avatarUrl,
      timestamp: Date.now(),
      channelId: targetChannelId,
      threadId: threadId || undefined,
      attachments: attachments || undefined,
      edited: false,
      replyCount: 0
    }

    // Add optimistic message to state immediately
    console.log('💬 Adding optimistic message')
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, optimisticMessage]
      
      // If this is a thread reply, update parent message reply count optimistically
      if (threadId) {
        return newMessages.map(msg => {
          if (msg.id === threadId) {
            return {
              ...msg,
              replyCount: (msg.replyCount || 0) + 1
            }
          }
          return msg
        })
      }
      
      return newMessages
    })

    try {
      console.log('💬 Sending message to database')
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          user_id: user.id,
          channel_id: targetChannelId,
          thread_id: threadId || null,
          attachments: attachments || null
        })
        .select(`
          *,
          users(id, username, avatar_url)
        `)
        .single()

      if (error) throw error

      // Replace optimistic message with real message from server
      if (data) {
        console.log('💬 Replacing optimistic message with server response')
        const realMessage: Message = {
          id: data.id,
          content: data.content,
          userId: data.user_id,
          userName: data.users?.username || user.login,
          userAvatar: data.users?.avatar_url || user.avatarUrl,
          timestamp: new Date(data.created_at).getTime(),
          channelId: data.channel_id,
          threadId: data.thread_id || undefined,
          attachments: data.attachments || undefined,
          edited: data.edited,
          editedAt: data.edited_at ? new Date(data.edited_at).getTime() : undefined,
          replyCount: 0
        }

        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === optimisticMessage.id ? realMessage : msg
          )
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error and revert reply count if needed
      console.log('💬 Removing failed optimistic message')
      setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => msg.id !== optimisticMessage.id)
        
        // If this was a thread reply, revert parent message reply count
        if (threadId) {
          return filteredMessages.map(msg => {
            if (msg.id === threadId) {
              return {
                ...msg,
                replyCount: Math.max((msg.replyCount || 1) - 1, 0)
              }
            }
            return msg
          })
        }
        
        return filteredMessages
      })
    }
  }, [user, currentChannel])

  const createChannel = useCallback(async (name: string) => {
    if (!user) return ''

    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: `${name} discussion`,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('Error creating channel:', error)
      return ''
    }
  }, [user])

  const updateChannel = useCallback(async (channelId: string, name: string, description: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('channels')
        .update({ name, description })
        .eq('id', channelId)
        .eq('created_by', user.id) // Only allow creator to update

      if (error) throw error
    } catch (error) {
      console.error('Error updating channel:', error)
    }
  }, [user])

  const deleteChannel = useCallback(async (channelId: string) => {
    if (!user) return

    try {
      // Don't allow deleting general channel
      const channel = channels.find(c => c.id === channelId)
      if (channel?.name === 'general') return

      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId)
        .eq('created_by', user.id) // Only allow creator to delete

      if (error) throw error
    } catch (error) {
      console.error('Error deleting channel:', error)
    }
  }, [user, channels])

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return

    try {
      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle()

      // Optimistically update the UI first
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id !== messageId) return msg

          const reactions = msg.reactions || []
          const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji)

          if (existingReaction) {
            // Remove reaction optimistically
            console.log('🔗 Removing reaction optimistically')
            if (existingReactionIndex !== -1) {
              const updatedReaction = { ...reactions[existingReactionIndex] }
              updatedReaction.users = updatedReaction.users.filter(username => username !== user.login)
              updatedReaction.count = Math.max(0, updatedReaction.count - 1)
              
              if (updatedReaction.count === 0) {
                // Remove the reaction entirely if no users left
                return {
                  ...msg,
                  reactions: reactions.filter((_, i) => i !== existingReactionIndex)
                }
              } else {
                const newReactions = [...reactions]
                newReactions[existingReactionIndex] = updatedReaction
                return { ...msg, reactions: newReactions }
              }
            }
          } else {
            // Add reaction optimistically
            console.log('🔗 Adding reaction optimistically')
            if (existingReactionIndex !== -1) {
              // Add to existing reaction
              const updatedReaction = { ...reactions[existingReactionIndex] }
              updatedReaction.users = [...updatedReaction.users, user.login]
              updatedReaction.count = updatedReaction.count + 1
              
              const newReactions = [...reactions]
              newReactions[existingReactionIndex] = updatedReaction
              return { ...msg, reactions: newReactions }
            } else {
              // Create new reaction
              const newReaction: MessageReaction = {
                emoji,
                count: 1,
                users: [user.login]
              }
              return { ...msg, reactions: [...reactions, newReaction] }
            }
          }
          
          return msg
        })
      })

      if (existingReaction) {
        // Remove reaction from database
        console.log('🔗 Removing reaction from database')
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (error) throw error
      } else {
        // Add reaction to database
        console.log('🔗 Adding reaction to database')
        const { error } = await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
      // Revert optimistic update on error by refetching
      fetchMessages().catch(console.error)
    }
  }, [user, fetchMessages])

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user) return

    // Store original message for rollback
    let originalMessage: Message | null = null

    // Optimistically update the UI first
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId && msg.userId === user.id) {
          originalMessage = msg // Store for potential rollback
          console.log('✏️ Editing message optimistically')
          return {
            ...msg,
            content: newContent.trim(),
            edited: true,
            editedAt: Date.now()
          }
        }
        return msg
      })
    })

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent.trim(),
          edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.id) // Only allow editing own messages

      if (error) throw error
      console.log('✏️ Message edit saved to database')
    } catch (error) {
      console.error('Error editing message:', error)
      // Rollback optimistic update on error
      if (originalMessage) {
        console.log('✏️ Rolling back message edit')
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId ? originalMessage! : msg
          )
        )
      }
    }
  }, [user])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return

    // Store deleted message and related messages for potential rollback
    let deletedMessage: Message | null = null
    let affectedMessages: Message[] = []

    // Optimistically update the UI first
    setMessages(prevMessages => {
      const messageToDelete = prevMessages.find(msg => msg.id === messageId)
      if (!messageToDelete || messageToDelete.userId !== user.id) return prevMessages

      deletedMessage = messageToDelete
      console.log('🗑️ Deleting message optimistically')

      // Remove the message and any thread replies
      const filteredMessages = prevMessages.filter(msg => {
        // Remove the main message
        if (msg.id === messageId) return false
        // Remove thread replies to this message
        if (msg.threadId === messageId) return false
        return true
      })

      // Update reply counts for parent messages if this was a thread reply
      if (messageToDelete.threadId) {
        return filteredMessages.map(msg => {
          if (msg.id === messageToDelete.threadId) {
            const updatedMsg = {
              ...msg,
              replyCount: Math.max((msg.replyCount || 1) - 1, 0)
            }
            affectedMessages.push(msg) // Store original for rollback
            return updatedMsg
          }
          return msg
        })
      }

      return filteredMessages
    })

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id) // Only allow deleting own messages

      if (error) throw error
      console.log('🗑️ Message deletion saved to database')
    } catch (error) {
      console.error('Error deleting message:', error)
      // Rollback optimistic update on error
      if (deletedMessage) {
        console.log('🗑️ Rolling back message deletion')
        setMessages(prevMessages => {
          let restoredMessages = [...prevMessages, deletedMessage!]
          
          // Restore any thread replies that were removed
          // Note: In a real app, you'd want to store and restore all affected thread replies
          
          // Restore reply counts if needed
          affectedMessages.forEach(originalMsg => {
            restoredMessages = restoredMessages.map(msg => 
              msg.id === originalMsg.id ? originalMsg : msg
            )
          })
          
          // Sort by timestamp to maintain order
          return restoredMessages.sort((a, b) => a.timestamp - b.timestamp)
        })
      }
    }
  }, [user])

  return {
    currentChannel,
    setCurrentChannel,
    messages,
    channels,
    lastReadTimestamps,
    loading,
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