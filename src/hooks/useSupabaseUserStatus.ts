import { useState, useEffect, useCallback } from 'react'
import { UserInfo, UserStatus } from '@/types'

// Local storage key for status persistence
const USER_STATUS_KEY = 'user-status'

export const useSupabaseUserStatus = (user: UserInfo | null, updateUser?: (updates: Partial<UserInfo>) => void) => {
  const [status, setStatus] = useState<UserStatus>('active')
  const [loading, setLoading] = useState(false)

  // Load status from localStorage on mount
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem(USER_STATUS_KEY)
      if (savedStatus && ['active', 'away', 'busy'].includes(savedStatus)) {
        console.log('🔄 Loading saved status from localStorage:', savedStatus)
        setStatus(savedStatus as UserStatus)
      }
    } catch (error) {
      console.error('❌ Error loading status from localStorage:', error)
    }
  }, [])

  // Sync status with user prop if it changes
  useEffect(() => {
    if (user?.status && user.status !== status) {
      console.log('🔄 Syncing status from user prop:', user.status)
      setStatus(user.status)
    }
  }, [user?.status]) // Remove status from deps to prevent infinite loop

  // Update status manually
  const updateStatus = useCallback(async (newStatus: UserStatus) => {
    console.log('🔄 Manually updating user status to:', newStatus)
    setLoading(true)
    
    try {
      // Save to localStorage
      localStorage.setItem(USER_STATUS_KEY, newStatus)
      console.log('🔄 Saved status to localStorage:', newStatus)
      
      setStatus(newStatus)
      
      // Update the user object in the auth context if updateUser is provided
      if (updateUser) {
        console.log('🔄 Updating user object in auth context')
        updateUser({ status: newStatus })
      }
      
      console.log('✅ Status updated successfully:', newStatus)
    } catch (error) {
      console.error('❌ Error updating user status:', error)
    } finally {
      setLoading(false)
    }
  }, [updateUser])

  return {
    status,
    setStatus: updateStatus,
    loading
  }
}