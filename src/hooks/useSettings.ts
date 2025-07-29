import { useKV } from '@github/spark/hooks'
import { useEffect } from 'react'
import { NotificationSettings } from '@/types'

export type Theme = 'light' | 'dark'
export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'red'

export interface Settings {
  theme: Theme
  colorTheme: ColorTheme
  notifications: NotificationSettings
}

const defaultNotificationSettings: NotificationSettings = {
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
}

const defaultSettings: Settings = {
  theme: 'light',
  colorTheme: 'orange',
  notifications: defaultNotificationSettings
}

export const useSettings = () => {
  const [settings, setSettings] = useKV('app-settings', defaultSettings)

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light')
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red')
    
    // Add current theme classes
    root.classList.add(settings.theme)
    root.classList.add(`theme-${settings.colorTheme}`)
  }, [settings])

  const updateTheme = (theme: Theme) => {
    setSettings(current => ({ ...current, theme }))
  }

  const updateColorTheme = (colorTheme: ColorTheme) => {
    setSettings(current => ({ ...current, colorTheme }))
  }

  const updateNotifications = (notifications: Partial<NotificationSettings>) => {
    setSettings(current => ({ 
      ...current, 
      notifications: { ...current.notifications, ...notifications }
    }))
  }

  const updateChannelNotifications = (channelId: string, channelSettings: { muted: boolean; customSound?: NotificationSettings['soundType'] }) => {
    setSettings(current => ({
      ...current,
      notifications: {
        ...current.notifications,
        channelSettings: {
          ...current.notifications.channelSettings,
          [channelId]: channelSettings
        }
      }
    }))
  }

  return {
    settings,
    updateTheme,
    updateColorTheme,
    updateNotifications,
    updateChannelNotifications
  }
}