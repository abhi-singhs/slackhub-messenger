import { useState, useEffect, useRef } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserInfo } from '@/types'

export const useAuth = () => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    console.log('🔐 Auth effect starting...')

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session:', session ? 'exists' : 'none')
      setSession(session)
      if (session?.user) {
        if (lastUserIdRef.current !== session.user.id) {
          lastUserIdRef.current = session.user.id
          console.log('🔐 Session user found, bootstrapping profile for:', session.user.id)
          bootstrapUser(session.user)
        } else {
          console.log('🔐 Session user already handled, skipping duplicate init')
          setLoading(false)
        }
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
        const id = session.user.id
        if (event === 'INITIAL_SESSION' && lastUserIdRef.current === id) {
          console.log('🔐 Duplicate INITIAL_SESSION for same user, ignoring')
          return
        }
        if (lastUserIdRef.current !== id) {
          lastUserIdRef.current = id
        }
        console.log('� Bootstrapping profile for auth event:', event, id)
        bootstrapUser(session.user)
      } else {
        console.log('🔐 No session user, clearing user state')
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sets user immediately from session metadata, then syncs DB profile in background
  const bootstrapUser = (sessionUser: SupabaseUser) => {
    const meta = sessionUser.user_metadata || {}
    const immediateUser: UserInfo = {
      id: sessionUser.id,
      login: meta.preferred_username || meta.user_name || meta.name || sessionUser.email?.split('@')[0] || 'User',
      avatarUrl: meta.avatar_url || '',
      email: sessionUser.email || '',
      isOwner: false,
      status: 'active'
    }
    console.log('👤 Setting session user immediately:', immediateUser.login)
    setUser(immediateUser)
    setLoading(false)

    // Background sync with DB profile
    syncProfileFromDB(sessionUser).catch((e) => {
      console.warn('⚠️ Background profile sync skipped/failed:', (e as Error)?.message)
    })
  }

  const syncProfileFromDB = async (sessionUser: SupabaseUser) => {
    const userId = sessionUser.id
    console.log('🔄 Syncing user profile from DB for:', userId)
    const timeoutMs = 3000
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
    const queryPromise = supabase.from('users').select('*').eq('id', userId).single()

    try {
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('� No user row; upserting from session meta')
          await supabase.from('users').upsert({
            id: sessionUser.id,
            username: sessionUser.user_metadata?.preferred_username || sessionUser.user_metadata?.user_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
            email: sessionUser.email,
            avatar_url: sessionUser.user_metadata?.avatar_url || '',
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          return
        }
        console.warn('⚠️ DB profile fetch error:', error.message)
        return
      }
      if (data) {
        console.log('✅ DB profile found, updating local user:', data.username)
        setUser(prev => prev ? {
          ...prev,
          login: data.username,
          avatarUrl: data.avatar_url || prev.avatarUrl,
          email: data.email || prev.email,
          status: data.status || prev.status
        } : {
          id: data.id,
          login: data.username,
          avatarUrl: data.avatar_url || '',
          email: data.email,
          isOwner: false,
          status: data.status || 'active'
        })
      }
    } catch (e) {
      console.warn('⚠️ DB profile sync timeout/error:', (e as Error)?.message)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    // Email/password sign-up is disabled in this app.
    return { data: null, error: new Error('Email/password sign-up is disabled') }
  }

  const signIn = async (_email: string, _password: string) => {
    // Email/password sign-in is disabled in this app.
    return { data: null, error: new Error('Email/password sign-in is disabled') }
  }

  const signInWithGitHub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.href.replace(/#$/, ''),
      }
    })

    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href.replace(/#$/, ''),
      }
    })

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

  // Update only the username with validation and uniqueness check
  const updateUsername = async (newUsername: string): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: 'Not signed in' }

    const username = (newUsername || '').trim()
    if (!username) return { ok: false, error: 'Username is required' }

    // Basic client-side validation: 3-24 chars, letters/numbers/underscore
    const usernameRegex = /^[a-zA-Z0-9_]{3,24}$/
    if (!usernameRegex.test(username)) {
      return { ok: false, error: 'Use 3-24 letters, numbers, or _ only' }
    }

    // No-op if unchanged (case-sensitive compare to preserve user intent)
    if (username === user.login) {
      return { ok: true }
    }

    // Check availability
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)

    if (selectError) {
      console.warn('⚠️ Username availability check failed:', selectError.message)
      // Fall through to attempt update which will still be guarded by DB unique constraint
    }

    if (existing && existing.length > 0 && existing[0]?.id !== user.id) {
      return { ok: false, error: 'That username is taken' }
    }

    // Attempt update (DB has UNIQUE constraint as final guard)
    const { data, error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user.id)
      .select('id, username, avatar_url, email, status')
      .single()

    if (error) {
      // 23505 = unique_violation
      const code = (error as any)?.code
      if (code === '23505') return { ok: false, error: 'That username is taken' }
      return { ok: false, error: error.message || 'Failed to update username' }
    }

    if (data) {
      setUser(prev => prev ? { ...prev, login: data.username } : prev)
    }

    return { ok: true }
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
    // Email/password methods intentionally disabled; not exposed in UI
    // signUp,
    // signIn,
    signInWithGitHub,
    signInWithGoogle,
    // Anonymous sign-in removed
    signOut,
    updateProfile,
    updateUsername,
    updateUserStatus,
    updateUserLocal
  }
}