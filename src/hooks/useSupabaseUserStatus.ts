import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo, UserStatus } from '@/types'

export const useSupabaseUserStatus = (user: UserInfo | null, updateUser?: (updates: Partial<UserInfo>) => void) => {
  const [status, setStatus] = useState<UserStatus>('active')
  const [loading, setLoading] = useState(false)
  const [manualOverrideUntil, setManualOverrideUntil] = useState<number>(0)

  // Sync status with user prop on mount
  useEffect(() => {
    if (user?.status) {
      console.log('🔄 Syncing status from user prop:', user.status)
      setStatus(user.status)
    }
  }, [user?.status])

  // Update status in Supabase and local state
  const updateStatus = useCallback(async (newStatus: UserStatus, isManual = false) => {
    if (!user) return

    console.log('🔄 Updating user status from:', status, 'to:', newStatus, 'manual:', isManual)
    setLoading(true)
    
    // Track if this was a manual change - set override for 5 minutes
    if (isManual) {
      setManualOverrideUntil(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id)

      if (error) throw error

      console.log('✅ Status updated in database:', newStatus)
      setStatus(newStatus)
      
      // Also update the user object in the auth context if updateUser is provided
      if (updateUser) {
        console.log('🔄 Updating user object in auth context')
        updateUser({ status: newStatus })
      }
    } catch (error) {
      console.error('❌ Error updating user status:', error)
    } finally {
      setLoading(false)
    }
  }, [user, updateUser, status])

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
          console.log('📡 Real-time status update received:', payload)
          if (payload.new.status) {
            const newStatus = payload.new.status as UserStatus
            console.log('🔄 Setting status from real-time update:', newStatus)
            setStatus(newStatus)
            // Also update the user object in the auth context if updateUser is provided
            if (updateUser) {
              console.log('🔄 Updating user object from real-time update')
              updateUser({ status: newStatus })
            }
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

    let activityTimer: NodeJS.Timeout | undefined
    let awayTimer: NodeJS.Timeout | undefined

    const setActiveStatus = () => {
      const now = Date.now()
      const isOverridden = now < manualOverrideUntil
      
      // Only auto-change status if it wasn't manually set recently and current status allows auto-management
      if (!isOverridden && status !== 'active' && status !== 'busy') {
        console.log('🔄 Auto-setting status to active due to activity')
        updateStatus('active', false) // false = not manual
      } else if (!isOverridden && status === 'active') {
        console.log('🔄 Resetting away timer due to activity')
      } else if (isOverridden) {
        console.log('🔄 Skipping auto status change - manual override still active')
      }
      
      // Clear existing timers
      if (activityTimer) clearTimeout(activityTimer)
      if (awayTimer) clearTimeout(awayTimer)
      
      // Only set away timer if status wasn't manually set recently
      if (!isOverridden) {
        // Set away after 10 minutes of inactivity
        awayTimer = setTimeout(() => {
          const stillNotOverridden = Date.now() < manualOverrideUntil
          if (status === 'active' && !stillNotOverridden) {
            console.log('🔄 Auto-setting status to away due to inactivity')
            updateStatus('away', false) // false = not manual
          }
        }, 10 * 60 * 1000) // 10 minutes
      }
    }

    const handleActivity = () => {
      const now = Date.now()
      const isOverridden = now < manualOverrideUntil
      
      // If status was manually set to 'away' but override period expired, allow auto-management
      if (!isOverridden) {
        setActiveStatus()
      } else {
        console.log('🔄 Activity detected but manual override still active')
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        const isOverridden = now < manualOverrideUntil
        
        // If override period expired, allow auto-management
        if (!isOverridden) {
          setActiveStatus()
        } else {
          console.log('🔄 Tab became visible but manual override still active')
        }
      }
    }

    // Only auto-manage status if not manually overridden
    const now = Date.now()
    const isOverridden = now < manualOverrideUntil
    
    if (!isOverridden) {
      console.log('🔄 Setting up auto status management')
      // Add event listeners for user activity
      document.addEventListener('mousedown', handleActivity)
      document.addEventListener('mousemove', handleActivity)
      document.addEventListener('keypress', handleActivity)
      document.addEventListener('scroll', handleActivity)
      document.addEventListener('touchstart', handleActivity)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Set initial timer
      setActiveStatus()
    } else {
      console.log('🔄 Skipping auto status management - manual override active')
    }

    return () => {
      if (activityTimer) clearTimeout(activityTimer)
      if (awayTimer) clearTimeout(awayTimer)
      document.removeEventListener('mousedown', handleActivity)
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('scroll', handleActivity)
      document.removeEventListener('touchstart', handleActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, status, updateStatus, manualOverrideUntil])

  return {
    status,
    setStatus: (newStatus: UserStatus) => updateStatus(newStatus, true), // true = manual change
    loading
  }
}