import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo, UserStatus } from '@/types'

export const useSupabaseUserStatus = (user: UserInfo | null) => {
  const [status, setStatus] = useState<UserStatus>('active')
  const [loading, setLoading] = useState(false)

  // Sync status with user prop on mount
  useEffect(() => {
    if (user?.status) {
      setStatus(user.status)
    }
  }, [user?.status])

  // Update status in Supabase and local state
  const updateStatus = useCallback(async (newStatus: UserStatus) => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id)

      if (error) throw error

      setStatus(newStatus)
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Set up real-time subscription to listen for status changes
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel(`user-status-${user.id}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status) {
            setStatus(payload.new.status as UserStatus)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user])

  // Auto-set to active when user becomes active (window focus, mouse movement, etc.)
  useEffect(() => {
    if (!user) return

    let activityTimer: NodeJS.Timeout
    let awayTimer: NodeJS.Timeout

    const setActiveStatus = () => {
      if (status !== 'active' && status !== 'busy') {
        updateStatus('active')
      }
      
      // Clear existing timers
      clearTimeout(activityTimer)
      clearTimeout(awayTimer)
      
      // Set away after 10 minutes of inactivity
      awayTimer = setTimeout(() => {
        if (status === 'active') {
          updateStatus('away')
        }
      }, 10 * 60 * 1000) // 10 minutes
    }

    const handleActivity = () => {
      setActiveStatus()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setActiveStatus()
      }
    }

    // Only auto-manage status if not manually set to busy
    if (status !== 'busy') {
      // Add event listeners for user activity
      document.addEventListener('mousedown', handleActivity)
      document.addEventListener('mousemove', handleActivity)
      document.addEventListener('keypress', handleActivity)
      document.addEventListener('scroll', handleActivity)
      document.addEventListener('touchstart', handleActivity)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Set initial timer
      setActiveStatus()
    }

    return () => {
      clearTimeout(activityTimer)
      clearTimeout(awayTimer)
      document.removeEventListener('mousedown', handleActivity)
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('scroll', handleActivity)
      document.removeEventListener('touchstart', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, status, updateStatus])

  return {
    status,
    setStatus: updateStatus,
    loading
  }
}