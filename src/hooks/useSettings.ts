import { useKV } from '@github/spark/hooks'
import { useEffect } from 'react'

export type Theme = 'light' | 'dark'
export type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'red'

export interface Settings {
  theme: Theme
  colorTheme: ColorTheme
}

const defaultSettings: Settings = {
  theme: 'light',
  colorTheme: 'orange'
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

  return {
    settings,
    updateTheme,
    updateColorTheme
  }
}