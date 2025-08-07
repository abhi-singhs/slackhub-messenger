import { useState, useEffect, useCallback } from 'react'

interface LocalSettings {
  theme: string
  darkMode: boolean
}

// Local storage keys
const THEME_KEY = 'user-theme'
const DARK_MODE_KEY = 'user-dark-mode'

export const useSupabaseSettings = () => {
  const [theme, setTheme] = useState('blue')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    console.log('🎨 Loading settings from localStorage')
    try {
      const savedTheme = localStorage.getItem(THEME_KEY)
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY)
      
      if (savedTheme) {
        setTheme(savedTheme)
        console.log('🎨 Loaded theme:', savedTheme)
      }
      
      if (savedDarkMode !== null) {
        const isDark = savedDarkMode === 'true'
        setIsDarkMode(isDark)
        console.log('🎨 Loaded dark mode:', isDark)
      }
    } catch (error) {
      console.error('❌ Error loading settings from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save settings to localStorage
  const updateSettings = useCallback((updates: Partial<LocalSettings>) => {
    console.log('🎨 Updating settings in localStorage:', updates)
    try {
      if (updates.theme !== undefined) {
        localStorage.setItem(THEME_KEY, updates.theme)
        console.log('🎨 Saved theme to localStorage:', updates.theme)
      }
      
      if (updates.darkMode !== undefined) {
        localStorage.setItem(DARK_MODE_KEY, updates.darkMode.toString())
        console.log('🎨 Saved dark mode to localStorage:', updates.darkMode)
      }
      
      console.log('✅ Settings updated successfully in localStorage')
    } catch (error) {
      console.error('❌ Error updating settings in localStorage:', error)
    }
  }, [])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Apply theme and dark mode to document
  useEffect(() => {
    if (loading) return // Wait for settings to load
    
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
  }, [theme, isDarkMode]) // Removed loading from dependencies to prevent infinite loops

  // Initialize default theme only once on mount
  useEffect(() => {
    if (loading) return
    
    const root = document.documentElement
    // Only set default if no theme classes exist at all
    const hasAnyThemeClass = ['theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red']
      .some(className => root.classList.contains(className))
    
    if (!hasAnyThemeClass) {
      root.classList.add('theme-blue')
      console.log('🎨 Applied default theme: theme-blue')
    }
  }, [loading])

  const updateTheme = useCallback((newTheme: string) => {
    setTheme(newTheme)
    updateSettings({ theme: newTheme })
  }, [updateSettings])

  const updateColorTheme = useCallback((newColorTheme: string) => {
    console.log('🎨 Updating color theme to:', newColorTheme)
    setTheme(newColorTheme)
    updateSettings({ theme: newColorTheme })
  }, [updateSettings])

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    updateSettings({ darkMode: newDarkMode })
  }, [isDarkMode, updateSettings])

  // Create settings object compatible with SettingsModal expectations
  const settings = {
    theme: isDarkMode ? 'dark' as const : 'light' as const,
    colorTheme: theme
  }

  const updateThemeMode = useCallback((themeMode: 'light' | 'dark') => {
    console.log('🌓 Updating theme mode to:', themeMode)
    const newDarkMode = themeMode === 'dark'
    setIsDarkMode(newDarkMode)
    updateSettings({ darkMode: newDarkMode })
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