import { useCallback } from 'react'
import type { RichTextEditorHandle } from '@/components/RichTextEditor'

interface KeyboardShortcutHandlers {
  handleQuickSwitcher: () => void
  handleNextChannel: () => void
  handlePrevChannel: () => void
  handleToggleSidebar: () => void
  handleFocusInput: () => void
  handleFocusSearch: () => void
  handleAddReaction: () => void
  handleStartThreadOnLastMessage: () => void
  handleEscape: () => void
  handleEditLastMessage: () => void
}

interface AppKeyboardShortcutsProps {
  // Refs
  messageInputRef: React.RefObject<RichTextEditorHandle | null>
  searchInputRef: React.RefObject<HTMLInputElement>
  
  // State
  viewState: 'channel' | 'search'
  setShowQuickSwitcher: (show: boolean) => void
  setShowKeyboardHelp: (show: boolean) => void
  
  // Handler functions
  onQuickSwitcher: () => void
  onNextChannel: () => void
  onPrevChannel: () => void
  onToggleSidebar: () => void
  onAddReaction: () => void
  onStartThreadOnLastMessage: () => void
  onEscape: () => void
  onEditLastMessage: () => void
}

/**
 * Custom hook for managing application-level keyboard shortcuts
 * Provides handlers for common keyboard shortcuts and focus management
 */
export function useAppKeyboardShortcuts({
  messageInputRef,
  searchInputRef,
  viewState,
  setShowQuickSwitcher,
  setShowKeyboardHelp,
  onQuickSwitcher,
  onNextChannel,
  onPrevChannel,
  onToggleSidebar,
  onAddReaction,
  onStartThreadOnLastMessage,
  onEscape,
  onEditLastMessage
}: AppKeyboardShortcutsProps): KeyboardShortcutHandlers {

  const handleQuickSwitcher = useCallback(() => {
    setShowQuickSwitcher(true)
  }, [setShowQuickSwitcher])

  const handleNextChannel = useCallback(() => {
    onNextChannel()
  }, [onNextChannel])

  const handlePrevChannel = useCallback(() => {
    onPrevChannel()
  }, [onPrevChannel])

  const handleToggleSidebar = useCallback(() => {
    onToggleSidebar()
  }, [onToggleSidebar])

  const handleFocusInput = useCallback(() => {
    if (viewState === 'channel') {
      messageInputRef.current?.focus()
    }
  }, [viewState, messageInputRef])

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [searchInputRef])

  const handleAddReaction = useCallback(() => {
    onAddReaction()
  }, [onAddReaction])

  const handleStartThreadOnLastMessage = useCallback(() => {
    onStartThreadOnLastMessage()
  }, [onStartThreadOnLastMessage])

  const handleEscape = useCallback(() => {
    onEscape()
  }, [onEscape])

  const handleEditLastMessage = useCallback(() => {
    onEditLastMessage()
  }, [onEditLastMessage])

  const handleShowKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true)
  }, [setShowKeyboardHelp])

  return {
    handleQuickSwitcher,
    handleNextChannel,
    handlePrevChannel,
    handleToggleSidebar,
    handleFocusInput,
    handleFocusSearch,
    handleAddReaction,
    handleStartThreadOnLastMessage,
    handleEscape,
    handleEditLastMessage
  }
}
