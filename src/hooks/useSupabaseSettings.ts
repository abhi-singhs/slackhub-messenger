import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo, NotificationSettings } from '@/types'

interface SupabaseSettings {
  theme: string
  darkMode: boolean
  notificationSettings: NotificationSettings
}

export const useSupabaseSettings = (user: UserInfo | null) => {
  const [theme, setTheme] = useState('blue')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    soundVolume: 50,
    soundType: 'subtle',
    desktopNotifications: true,
    allMessages: false,
    directMessages: true,
    mentions: true,
    keywords: [],
    channelSettings: {},
    doNotDisturb: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  })
  const [loading, setLoading] = useState(true)

  // Fetch settings from Supabase
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme, dark_mode, notification_settings')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      if (data) {
        setTheme(data.theme || 'blue')
        setIsDarkMode(data.dark_mode || false)
        setNotificationSettings(data.notification_settings || notificationSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update settings in Supabase
  const updateSettings = useCallback(async (updates: Partial<SupabaseSettings>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...updates
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }, [user])

  // Load settings on mount and when user changes
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Apply theme and dark mode to document
  useEffect(() => {
    const root = document.documentElement
    
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
  }, [theme, isDarkMode])

  const updateTheme = useCallback(async (newTheme: string) => {
    setTheme(newTheme)
    await updateSettings({ theme: newTheme })
  }, [updateSettings])

  const toggleDarkMode = useCallback(async () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    await updateSettings({ darkMode: newDarkMode })
  }, [isDarkMode, updateSettings])

  const updateNotificationSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...notificationSettings, ...newSettings }
    setNotificationSettings(updatedSettings)
    await updateSettings({ notificationSettings: updatedSettings })
  }, [notificationSettings, updateSettings])

  return {
    theme,
    isDarkMode,
    notificationSettings,
    loading,
    updateTheme,
    toggleDarkMode,
    updateNotificationSettings
  }
}