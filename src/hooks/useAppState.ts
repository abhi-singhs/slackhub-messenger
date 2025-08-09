import { useState, useCallback, useRef } from 'react'
import type { RichTextEditorHandle } from '@/components/RichTextEditor'

// Types for app state
export type ViewState = 'channel' | 'search'

interface AppStateReturn {
  // UI State
  messageInput: string
  setMessageInput: (input: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  openEmojiPickers: Set<string>
  setOpenEmojiPickers: (pickers: Set<string>) => void
  showInputEmojiPicker: boolean
  setShowInputEmojiPicker: (show: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  viewState: ViewState
  setViewState: (state: ViewState) => void
  activeThreadId: string | null
  setActiveThreadId: (id: string | null) => void
  showQuickSwitcher: boolean
  setShowQuickSwitcher: (show: boolean) => void
  showKeyboardHelp: boolean
  setShowKeyboardHelp: (show: boolean) => void
  
  // Refs
  messageInputRef: React.RefObject<RichTextEditorHandle | null>
  searchInputRef: React.RefObject<HTMLInputElement>
  
  // Handlers
  handleEmojiPickerToggle: (messageId: string, open: boolean) => void
  handleSearchChange: (query: string) => void
  handleEscape: () => void
  clearAllStates: () => void
}

/**
 * Custom hook to manage application UI state
 * Centralizes all UI-related state and provides handlers for common operations
 */
export function useAppState(): AppStateReturn {
  // UI State
  const [messageInput, setMessageInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openEmojiPickers, setOpenEmojiPickers] = useState<Set<string>>(new Set())
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewState, setViewState] = useState<ViewState>('channel')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  
  // Refs
  const messageInputRef = useRef<RichTextEditorHandle | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null!)

  // Handlers
  const handleEmojiPickerToggle = useCallback((messageId: string, open: boolean) => {
    setOpenEmojiPickers(prev => {
      const newSet = new Set(prev)
      if (open) {
        newSet.add(messageId)
      } else {
        newSet.delete(messageId)
      }
      return newSet
    })
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    if (query.length >= 2) {
      setViewState('search')
    } else if (query.length === 0) {
      setViewState('channel')
    }
  }, [])

  const handleEscape = useCallback(() => {
    if (showQuickSwitcher) {
      setShowQuickSwitcher(false)
    } else if (showKeyboardHelp) {
      setShowKeyboardHelp(false)
    } else if (activeThreadId) {
      setActiveThreadId(null)
    } else if (openEmojiPickers.size > 0) {
      setOpenEmojiPickers(new Set())
    } else if (showInputEmojiPicker) {
      setShowInputEmojiPicker(false)
    } else if (searchQuery) {
      setSearchQuery('')
      setViewState('channel')
    }
  }, [showQuickSwitcher, showKeyboardHelp, activeThreadId, openEmojiPickers.size, showInputEmojiPicker, searchQuery])

  const clearAllStates = useCallback(() => {
    setMessageInput('')
    setSidebarOpen(false)
    setOpenEmojiPickers(new Set())
    setShowInputEmojiPicker(false)
    setSearchQuery('')
    setViewState('channel')
    setActiveThreadId(null)
    setShowQuickSwitcher(false)
    setShowKeyboardHelp(false)
  }, [])

  return {
    // State
    messageInput,
    setMessageInput,
    sidebarOpen,
    setSidebarOpen,
    openEmojiPickers,
    setOpenEmojiPickers,
    showInputEmojiPicker,
    setShowInputEmojiPicker,
    searchQuery,
    setSearchQuery,
    viewState,
    setViewState,
    activeThreadId,
    setActiveThreadId,
    showQuickSwitcher,
    setShowQuickSwitcher,
    showKeyboardHelp,
    setShowKeyboardHelp,
    
    // Refs
    messageInputRef,
    searchInputRef,
    
    // Handlers
    handleEmojiPickerToggle,
    handleSearchChange,
    handleEscape,
    clearAllStates
  }
}
