import { useState, useEffect } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserInfo } from '@/types'

export const useAuth = () => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 Auth effect starting...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session:', session ? 'exists' : 'none')
      setSession(session)
      if (session?.user) {
        console.log('🔐 Session user found, fetching profile for:', session.user.id)
        fetchUserProfile(session.user.id)
      } else {
        console.log('🔐 No session user, setting loading to false')
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'has session' : 'no session')
      setSession(session)
      
      if (session?.user) {
        console.log('🔐 New session user, fetching profile for:', session.user.id)
        await fetchUserProfile(session.user.id)
      } else {
        console.log('🔐 No session user, clearing user state')
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('👤 Fetching user profile for:', userId)
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        
        // If the user doesn't exist in the users table, create one from session data
        if (error.code === 'PGRST116') { // No rows found
          console.log('📝 User not found in users table, creating from session data')
          await createUserFromSession(userId)
          return
        }
        
        // For other errors, fall back to session data
        console.log('🔧 Falling back to session data due to error')
        await createUserFromSession(userId)
        return
      }

      if (data) {
        console.log('✅ User profile fetched:', data.username)
        setUser({
          id: data.id,
          login: data.username,
          avatarUrl: data.avatar_url || '',
          email: data.email,
          isOwner: false,
          status: data.status || 'active'
        })
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ User profile fetch failed:', error)
      console.log('🔧 Falling back to session data due to timeout/error')
      await createUserFromSession(userId)
    }
  }

  const createUserFromSession = async (userId: string) => {
    console.log('🔧 createUserFromSession starting for:', userId)
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fallback timeout')), 5000)
      )
      
      // Get current session from the existing session state
      const sessionPromise = supabase.auth.getSession()
      const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]) as any
      console.log('📋 Session data retrieved:', sessionData.session?.user ? 'has user' : 'no user')
      
      if (sessionData.session?.user) {
        const sessionUser = sessionData.session.user
        const userData = sessionUser.user_metadata
        
        const fallbackUser = {
          id: sessionUser.id,
          login: userData.preferred_username || userData.user_name || userData.name || sessionUser.email?.split('@')[0] || 'User',
          avatarUrl: userData.avatar_url || '',
          email: sessionUser.email || '',
          isOwner: false,
          status: 'active' as const
        }

        console.log('👤 Setting fallback user:', fallbackUser.login)
        setUser(fallbackUser)
        
        // Try to create the user record in background (don't await)
        supabase
          .from('users')
          .insert({
            id: sessionUser.id,
            username: fallbackUser.login,
            email: sessionUser.email,
            avatar_url: userData.avatar_url,
            status: 'active'
          })
          .then(({ error: createError }) => {
            if (createError) {
              console.log('⚠️ Could not create user record:', createError.message)
            } else {
              console.log('✅ User record created successfully')
            }
          })

        console.log('✅ Auth loading complete')
        setLoading(false)
      } else {
        console.log('❌ No session user found')
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Error creating user from session:', error)
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    })

    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }

  const signInWithGitHub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}`,
      }
    })

    return { data, error }
  }

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously()
    
    // If anonymous sign in successful, create a user profile
    if (!error && data?.user) {
      // Generate a random username for anonymous users
      const randomUsername = `Anonymous_${Math.random().toString(36).substr(2, 8)}`
      
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          username: randomUsername,
          email: data.user.email || '',
          avatar_url: '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.error('Error creating anonymous user profile:', profileError)
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateProfile = async (updates: Partial<{
    username: string
    avatar_url: string
    status: 'active' | 'away' | 'busy'
  }>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setUser(prev => prev ? {
        ...prev,
        login: data.username,
        avatarUrl: data.avatar_url || '',
        status: data.status
      } : null)
    }

    return { data, error }
  }

  const updateUserStatus = async (status: 'active' | 'away' | 'busy') => {
    return updateProfile({ status })
  }

  const updateUserLocal = (updates: Partial<UserInfo>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null)
  }

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGitHub,
    signInAnonymously,
    signOut,
    updateProfile,
    updateUserStatus,
    updateUserLocal
  }
}