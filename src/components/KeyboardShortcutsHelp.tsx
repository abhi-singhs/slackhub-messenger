import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getModifierKey, getAltKey, getShiftKey } from '@/hooks/useKeyboardShortcuts'
import { KEYBOARD_SHORTCUTS } from '@/constants'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsHelp = ({ isOpen, onClose }: KeyboardShortcutsHelpProps) => {
  const modKey = getModifierKey()
  const altKey = getAltKey()
  const shiftKey = getShiftKey()
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform)

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: [`${modKey}`, 'K'], description: 'Quick channel switcher' },
        { keys: [`${modKey}`, 'F'], description: 'Search messages' },
  { keys: isMac ? [altKey, '↑'] : [altKey, shiftKey, '↑'], description: 'Previous channel' },
  { keys: isMac ? [altKey, '↓'] : [altKey, shiftKey, '↓'], description: 'Next channel' },
        { keys: [`${modKey}`, '\\'], description: 'Toggle sidebar' },
      ]
    },
    {
      category: 'Messaging',
      items: [
        { keys: ['C'], description: 'Focus message input' },
        { keys: [`${modKey}`, 'Enter'], description: 'Send message' },
        { keys: ['R'], description: 'Add reaction to last message' },
        { keys: ['T'], description: 'Start thread on last message' },
        { keys: ['E'], description: 'Edit last message' },
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['Esc'], description: 'Close dialogs/cancel actions' },
        { keys: [`${modKey}`, '/'], description: 'Show keyboard shortcuts' },
      ]
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1">
                          <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Navigation shortcuts (C, R, T, E) work when not typing in input fields. 
            Use {modKey}+Enter to send messages while typing. On Windows/Linux, channel navigation uses {altKey}+{shiftKey}+↑/↓.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}