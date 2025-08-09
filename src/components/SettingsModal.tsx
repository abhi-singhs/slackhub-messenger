import { useState } from 'react'
import { Gear, Moon, Sun, Palette } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserInfo } from '@/types'
import { THEME_OPTIONS } from '@/constants'

interface SettingsModalProps {
  user?: UserInfo | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Theme management props passed from parent
  settings?: {
    theme: 'light' | 'dark'
    colorTheme: string
  }
  updateTheme?: (theme: 'light' | 'dark') => void
  updateColorTheme?: (theme: string) => void
  // Profile management
  updateUsername?: (username: string) => Promise<{ ok: boolean; error?: string }>
}

export const SettingsModal = ({ 
  user, 
  trigger, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  settings: passedSettings,
  updateTheme: passedUpdateTheme,
  updateColorTheme: passedUpdateColorTheme,
  updateUsername
}: SettingsModalProps) => {
  // Use only passed props - no hook calls to avoid conflicts with App.tsx
  const settings = passedSettings || { theme: 'light', colorTheme: 'blue' }
  const updateTheme = passedUpdateTheme || (() => {})
  const updateColorTheme = passedUpdateColorTheme || (() => {})
  
  const [internalOpen, setInternalOpen] = useState(false)
  const [username, setUsername] = useState<string>(user?.login || '')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameSaved, setUsernameSaved] = useState(false)
  const [savingUsername, setSavingUsername] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  // Sync input when dialog opens or user changes
  if (open && username === '' && (user?.login || '') !== '') {
    // Initialize once on first open
    setUsername(user?.login || '')
  }

  const handleThemeToggle = (checked: boolean) => {
    console.log('🌓 Theme toggle clicked:', checked)
    updateTheme(checked ? 'dark' : 'light')
  }

  const handleColorThemeChange = (value: string) => {
    console.log('🎨 Color theme changed:', value)
    updateColorTheme(value)
  }

  const handleSaveUsername = async () => {
    if (!updateUsername) return
    setUsernameError(null)
    setUsernameSaved(false)
    const value = username.trim()
    if (!value) {
      setUsernameError('Username is required')
      return
    }
    const re = /^[a-zA-Z0-9_]{3,24}$/
    if (!re.test(value)) {
      setUsernameError('Use 3-24 letters, numbers, or _ only')
      return
    }
    setSavingUsername(true)
    const result = await updateUsername(value)
    setSavingUsername(false)
    if (!result.ok) {
      setUsernameError(result.error || 'Failed to update username')
      setUsernameSaved(false)
    } else {
      setUsernameSaved(true)
    }
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Gear className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] mt-6">
          <div className="space-y-6 pr-4">
            {/* Profile: Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setUsernameError(null)
                    setUsernameSaved(false)
                  }}
                  placeholder="your_username"
                />
                <Button onClick={handleSaveUsername} disabled={savingUsername || !updateUsername}>
                  {savingUsername ? 'Saving…' : 'Save'}
                </Button>
              </div>
              {usernameError && (
                <p className="text-xs text-destructive">{usernameError}</p>
              )}
              {usernameSaved && !usernameError && (
                <p className="text-xs text-green-600 dark:text-green-500">Username updated</p>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-sm font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
                </div>
              </div>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>

            {/* Color Theme Picker */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Color Theme</Label>
                  <p className="text-xs text-muted-foreground">Choose your preferred accent color</p>
                </div>
              </div>
              
              <RadioGroup
                value={settings.colorTheme}
                onValueChange={handleColorThemeChange}
                className="grid grid-cols-5 gap-3"
              >
                {THEME_OPTIONS.map((option) => (
                  <div key={option.value} className="flex flex-col items-center gap-2">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          settings.colorTheme === option.value
                            ? 'border-foreground scale-110'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="text-xs text-muted-foreground">{option.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}