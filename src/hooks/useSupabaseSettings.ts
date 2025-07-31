import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo } from '@/types'

interface SupabaseSettings {
  theme: string
  darkMode: boolean
}

export const useSupabaseSettings = (user: UserInfo | null) => {
  const [theme, setTheme] = useState('blue')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch settings from Supabase
  const fetchSettings = useCallback(async () => {
    if (!user) {
      console.log('🎨 No user, skipping settings fetch')
      setLoading(false)
      return
    }

    console.log('🎨 Fetching settings for user:', user.id)
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme, dark_mode')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      if (data) {
        console.log('🎨 Settings data received:', data)
        setTheme(data.theme || 'blue')
        setIsDarkMode(data.dark_mode || false)
      } else {
        console.log('🎨 No settings found, using defaults')
        // Set default theme class when no settings exist
        setTheme('blue')
        setIsDarkMode(false)
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update settings in Supabase
  const updateSettings = useCallback(async (updates: Partial<SupabaseSettings>) => {
    if (!user) return

    console.log('🎨 Updating settings:', updates)
    try {
      // Convert the updates to match database column names
      const dbUpdates: any = {
        user_id: user.id,
      }
      
      if (updates.theme !== undefined) {
        dbUpdates.theme = updates.theme
      }
      
      if (updates.darkMode !== undefined) {
        dbUpdates.dark_mode = updates.darkMode
      }

      // Use UPSERT to handle both insert and update cases
      const { error } = await supabase
        .from('user_settings')
        .upsert(dbUpdates, {
          onConflict: 'user_id'
        })

      if (error) throw error
      console.log('✅ Settings updated successfully')
    } catch (error) {
      console.error('❌ Error updating settings:', error)
    }
  }, [user])

  // Load settings on mount and when user changes
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Set up real-time subscription for settings changes
  useEffect(() => {
    if (!user) return

    console.log('🔄 Setting up real-time subscription for user settings')

    const subscription = supabase
      .channel(`user-settings-${user.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Real-time settings update received:', payload)
          if (payload.new) {
            const settings = payload.new as any
            console.log('🎨 Applying settings from real-time update:', settings)
            setTheme(settings.theme || 'blue')
            setIsDarkMode(settings.dark_mode || false)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔄 Cleaning up settings real-time subscription')
      supabase.removeChannel(subscription)
    }
  }, [user])

  // Apply theme and dark mode to document
  useEffect(() => {
    const root = document.documentElement
    
    console.log('🎨 Applying theme - isDarkMode:', isDarkMode, 'theme:', theme)
    
    // Remove all existing theme classes
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red')
    
    // Add current theme class
    root.classList.add(`theme-${theme}`)
    
    // Toggle dark mode
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    console.log('🎨 Applied classes:', root.classList.toString())
  }, [theme, isDarkMode])

  // Set initial theme on mount if no user is present
  useEffect(() => {
    if (!user && !loading) {
      const root = document.documentElement
      // Apply default theme if no user settings
      if (!root.classList.contains('theme-blue') && 
          !root.classList.contains('theme-green') && 
          !root.classList.contains('theme-purple') && 
          !root.classList.contains('theme-orange') && 
          !root.classList.contains('theme-red')) {
        root.classList.add('theme-blue')
      }
    }
  }, [user, loading])

  const updateTheme = useCallback(async (newTheme: string) => {
    setTheme(newTheme)
    await updateSettings({ theme: newTheme })
  }, [updateSettings])

  const updateColorTheme = useCallback(async (newColorTheme: string) => {
    console.log('🎨 Updating color theme to:', newColorTheme)
    setTheme(newColorTheme)
    await updateSettings({ theme: newColorTheme })
  }, [updateSettings])

  const toggleDarkMode = useCallback(async () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    await updateSettings({ darkMode: newDarkMode })
  }, [isDarkMode, updateSettings])

  const updateNotificationSettings = useCallback(async () => {
    // Function removed - notifications are no longer supported
    console.warn('Notification settings have been removed from the application')
  }, [])

  // Create settings object compatible with SettingsModal expectations
  const settings = {
    theme: isDarkMode ? 'dark' as const : 'light' as const,
    colorTheme: theme
  }

  const updateThemeMode = useCallback(async (themeMode: 'light' | 'dark') => {
    console.log('🌓 Updating theme mode to:', themeMode)
    const newDarkMode = themeMode === 'dark'
    setIsDarkMode(newDarkMode)
    await updateSettings({ darkMode: newDarkMode })
  }, [updateSettings])

  return {
    theme,
    isDarkMode,
    loading,
    toggleDarkMode,
    // Add SettingsModal-compatible interface
    settings,
    updateTheme: updateThemeMode, // For dark/light mode updates
    updateColorTheme
  }
}