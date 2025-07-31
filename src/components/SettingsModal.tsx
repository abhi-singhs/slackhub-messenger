import { useState } from 'react'
import { Gear, Moon, Sun, Palette, Bell } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings'
import { NotificationSettings } from '@/components/NotificationSettings'
import { UserInfo, Channel } from '@/types'
import { THEME_OPTIONS } from '@/constants'

interface SettingsModalProps {
  user?: UserInfo | null
  channels?: Channel[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Theme management props passed from parent
  settings?: {
    theme: 'light' | 'dark'
    colorTheme: string
    notifications: any
  }
  updateTheme?: (theme: 'light' | 'dark') => void
  updateColorTheme?: (theme: string) => void
  updateNotificationSettings?: (settings: any) => void
}

export const SettingsModal = ({ 
  user, 
  channels = [], 
  trigger, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  settings: passedSettings,
  updateTheme: passedUpdateTheme,
  updateColorTheme: passedUpdateColorTheme,
  updateNotificationSettings: passedUpdateNotificationSettings
}: SettingsModalProps) => {
  // Conditionally call hook only if no props are passed (for backward compatibility)
  const hookResult = passedSettings ? null : useSupabaseSettings(user || null)
  
  // Use passed props if available, otherwise fall back to hook (with safe defaults)
  const settings = passedSettings || hookResult?.settings || { theme: 'light', colorTheme: 'blue', notifications: {} }
  const updateTheme = passedUpdateTheme || hookResult?.updateTheme || (() => {})
  const updateColorTheme = passedUpdateColorTheme || hookResult?.updateColorTheme || (() => {})
  const updateNotificationSettings = passedUpdateNotificationSettings || hookResult?.updateNotificationSettings || (() => {})
  
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const handleThemeToggle = (checked: boolean) => {
    console.log('🌓 Theme toggle clicked:', checked)
    updateTheme(checked ? 'dark' : 'light')
  }

  const handleColorThemeChange = (value: string) => {
    console.log('🎨 Color theme changed:', value)
    updateColorTheme(value)
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[60vh] mt-6">
            <TabsContent value="appearance" className="space-y-6 pr-4">
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
            </TabsContent>
            
            <TabsContent value="notifications" className="pr-4">
              <NotificationSettings user={user || null} channels={channels} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}