import { useEffect, useCallback } from 'react'

interface KeyboardShortcutsConfig {
  // Navigation
  onQuickSwitcher?: () => void
  onNextChannel?: () => void
  onPrevChannel?: () => void
  onToggleSidebar?: () => void
  
  // Messaging
  onFocusInput?: () => void
  onSendMessage?: () => void
  onAddReaction?: () => void
  onStartThread?: () => void
  onEditLastMessage?: () => void
  
  // Search
  onSearch?: () => void
  
  // General
  onEscape?: () => void
  onHelp?: () => void
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
  // Ignore while composing IME input
  if ((event as any).isComposing) return

  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform)

    // Don't trigger shortcuts when typing in inputs or contenteditable
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.getAttribute('role') === 'textbox'
    ) {
      // Allow some shortcuts even in input fields
      if (event.key === 'Escape' && config.onEscape) {
        config.onEscape()
        return
      }
      
      // Cmd/Ctrl + Enter to send message
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && config.onSendMessage) {
        event.preventDefault()
        config.onSendMessage()
        return
      }
      
      return
    }

    // Navigation shortcuts
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      config.onQuickSwitcher?.()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
      event.preventDefault()
      config.onSearch?.()
      return
    }

  // On macOS: Option + ArrowUp/Down
  // On Windows/Linux: Alt + Shift + ArrowUp/Down (to avoid system conflicts)
  if (event.altKey && event.key === 'ArrowUp' && (isMac || event.shiftKey)) {
      event.preventDefault()
      config.onPrevChannel?.()
      return
    }

  if (event.altKey && event.key === 'ArrowDown' && (isMac || event.shiftKey)) {
      event.preventDefault()
      config.onNextChannel?.()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
      event.preventDefault()
      config.onToggleSidebar?.()
      return
    }

    // Messaging shortcuts
    if (event.key === 'c' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      config.onFocusInput?.()
      return
    }

    if (event.key === 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      config.onAddReaction?.()
      return
    }

    if (event.key === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      config.onStartThread?.()
      return
    }

    if (event.key === 'e' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      config.onEditLastMessage?.()
      return
    }

    // General shortcuts
    if (event.key === 'Escape') {
      config.onEscape?.()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === '/') {
      event.preventDefault()
      config.onHelp?.()
      return
    }
  }, [config])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

// Helper to get the appropriate modifier key label based on platform
export const getModifierKey = () => {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌘' : 'Ctrl'
}

export const getAltKey = () => {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌥' : 'Alt'
}

export const getShiftKey = () => 'Shift'