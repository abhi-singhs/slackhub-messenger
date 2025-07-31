import { useState, useEffect } from 'react'
import { useSupabaseUserStatus } from './useSupabaseUserStatus'
import { useAuth } from './useAuth'
import { UserStatus } from '@/types'

export function useUserStatus() {
  const { user } = useAuth()
  const supabaseStatus = useSupabaseUserStatus(user)
  
  // Local status for non-authenticated users
  const [localStatus, setLocalStatus] = useState<UserStatus>(() => {
    try {
      const stored = localStorage.getItem('user-status')
      return (stored as UserStatus) || 'active'
    } catch {
      return 'active'
    }
  })

  // Save to localStorage when local status changes
  useEffect(() => {
    if (!user) {
      localStorage.setItem('user-status', localStatus)
    }
  }, [localStatus, user])

  // Use Supabase status if authenticated, otherwise use local
  const status = user ? supabaseStatus.status : localStatus
  
  const setStatus = (newStatus: UserStatus) => {
    if (user) {
      supabaseStatus.setStatus(newStatus)
    } else {
      setLocalStatus(newStatus)
    }
  }
  
  return {
    status,
    setStatus
  }
}