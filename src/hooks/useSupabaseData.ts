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
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedChannels: Channel[] = data.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description || ''
      }))

      setChannels(formattedChannels)

      // Set initial channel if none selected
      if (!currentChannel && formattedChannels.length > 0) {
        const generalChannel = formattedChannels.find(c => c.name === 'general') || formattedChannels[0]
        setCurrentChannel(generalChannel.id)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }, [currentChannel])

  // Fetch messages with reactions
  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          users!messages_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      // Fetch reactions for all messages
      const messageIds = messagesData.map(m => m.id)
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select('*')
        .in('message_id', messageIds)

      if (reactionsError) throw reactionsError

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
    }
  }, [])

  // Fetch user settings including last read timestamps
  const fetchUserSettings = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('last_read_timestamps')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      setLastReadTimestamps(data?.last_read_timestamps || {})
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [user])

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setLoading(true)
      await Promise.all([
        fetchChannels(),
        fetchMessages(),
        fetchUserSettings()
      ])
      setLoading(false)
    }

    loadData()
  }, [user, fetchChannels, fetchMessages, fetchUserSettings])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Subscribe to channel changes
    const channelsSubscription = supabase
      .channel('channels-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'channels' },
        () => fetchChannels()
      )
      .subscribe()

    // Subscribe to message changes
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchMessages()
      )
      .subscribe()

    // Subscribe to reaction changes
    const reactionsSubscription = supabase
      .channel('reactions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        () => fetchMessages()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelsSubscription)
      supabase.removeChannel(messagesSubscription)
      supabase.removeChannel(reactionsSubscription)
    }
  }, [user, fetchChannels, fetchMessages])

  const markChannelAsRead = useCallback(async (channelId: string) => {
    if (!user) return

    const now = Date.now()
    const newTimestamps = {
      ...lastReadTimestamps,
      [channelId]: now
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          last_read_timestamps: newTimestamps
        })

      if (error) throw error

      setLastReadTimestamps(newTimestamps)
    } catch (error) {
      console.error('Error marking channel as read:', error)
    }
  }, [user, lastReadTimestamps])

  const sendMessage = useCallback(async (
    content: string, 
    channelId?: string, 
    threadId?: string, 
    attachments?: FileAttachment[]
  ) => {
    if (!user || (!content.trim() && (!attachments || attachments.length === 0))) return

    const targetChannelId = channelId || currentChannel
    if (!targetChannelId) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          user_id: user.id,
          channel_id: targetChannelId,
          thread_id: threadId || null,
          attachments: attachments || null
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
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
        .single()

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (error) throw error
      } else {
        // Add reaction
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
    }
  }, [user])

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user) return

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
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }, [user])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id) // Only allow deleting own messages

      if (error) throw error
    } catch (error) {
      console.error('Error deleting message:', error)
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