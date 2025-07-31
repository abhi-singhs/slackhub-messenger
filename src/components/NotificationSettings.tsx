import { useState, useEffect } from 'react'
import { 
  Bell, 
  BellSlash,
  SpeakerHigh, 
  SpeakerX,
  Moon,
  Clock,
  ChatCircle,
  At,
  Hash,
  Plus,
  X,
  Play,
  Monitor
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/useSettings'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationSound, UserInfo, Channel } from '@/types'
import { toast } from 'sonner'

interface NotificationSettingsProps {
  user: UserInfo | null
  channels: Channel[]
}

const SOUND_OPTIONS: { value: NotificationSound; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No sound' },
  { value: 'subtle', label: 'Subtle', description: 'Gentle two-tone chime' },
  { value: 'classic', label: 'Classic', description: 'Traditional beep' },
  { value: 'modern', label: 'Modern', description: 'Tech-style sweep' }
]

export const NotificationSettings = ({ user, channels }: NotificationSettingsProps) => {
  const { settings, updateNotifications, updateChannelNotifications } = useSettings()
  const { notifications } = settings
  const { testNotificationSound, testDesktopNotification, hasNotificationPermission } = useNotifications(user, channels, [])
  
  const [newKeyword, setNewKeyword] = useState('')
  const [doNotDisturbUntil, setDoNotDisturbUntil] = useState('')

  // Initialize do not disturb until input
  useEffect(() => {
    if (notifications.doNotDisturbUntil) {
      const date = new Date(notifications.doNotDisturbUntil)
      setDoNotDisturbUntil(date.toISOString().slice(0, 16))
    }
  }, [notifications.doNotDisturbUntil])

  const handleSoundToggle = (enabled: boolean) => {
    updateNotifications({ soundEnabled: enabled })
    if (!enabled) {
      toast.success('Sound notifications disabled')
    } else {
      toast.success('Sound notifications enabled')
    }
  }

  const handleVolumeChange = (volume: number[]) => {
    updateNotifications({ soundVolume: volume[0] })
  }

  const handleSoundTypeChange = (soundType: NotificationSound) => {
    updateNotifications({ soundType })
    if (soundType !== 'none') {
      testNotificationSound(soundType, notifications.soundVolume)
    }
  }

  const handleDesktopNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await testDesktopNotification()
      if (hasPermission) {
        updateNotifications({ desktopNotifications: true })
        toast.success('Desktop notifications enabled')
      } else {
        toast.error('Desktop notifications permission denied')
      }
    } else {
      updateNotifications({ desktopNotifications: false })
      toast.success('Desktop notifications disabled')
    }
  }

  const handleTestSound = async () => {
    if (notifications.soundType === 'none') {
      toast.error('Please select a sound type first')
      return
    }
    await testNotificationSound(notifications.soundType, notifications.soundVolume)
    toast.success('Test sound played')
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !notifications.keywords.includes(newKeyword.trim())) {
      updateNotifications({ 
        keywords: [...notifications.keywords, newKeyword.trim()] 
      })
      setNewKeyword('')
      toast.success('Keyword added')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    updateNotifications({ 
      keywords: notifications.keywords.filter(k => k !== keyword) 
    })
    toast.success('Keyword removed')
  }

  const handleDoNotDisturbToggle = (enabled: boolean) => {
    updateNotifications({ 
      doNotDisturb: enabled,
      doNotDisturbUntil: enabled ? undefined : notifications.doNotDisturbUntil
    })
    toast.success(enabled ? 'Do not disturb enabled' : 'Do not disturb disabled')
  }

  const handleDoNotDisturbUntilChange = (value: string) => {
    setDoNotDisturbUntil(value)
    const timestamp = value ? new Date(value).getTime() : undefined
    updateNotifications({ doNotDisturbUntil: timestamp })
  }

  const handleQuietHoursToggle = (enabled: boolean) => {
    updateNotifications({ 
      quietHours: { ...notifications.quietHours, enabled } 
    })
    toast.success(enabled ? 'Quiet hours enabled' : 'Quiet hours disabled')
  }

  const handleQuietHoursChange = (field: 'startTime' | 'endTime', value: string) => {
    updateNotifications({ 
      quietHours: { ...notifications.quietHours, [field]: value } 
    })
  }

  const handleChannelMuteToggle = (channelId: string, muted: boolean) => {
    const currentSettings = notifications.channelSettings[channelId] || { muted: false }
    updateChannelNotifications(channelId, { ...currentSettings, muted })
    
    const channel = channels.find(c => c.id === channelId)
    toast.success(`#${channel?.name} ${muted ? 'muted' : 'unmuted'}`)
  }

  return (
    <div className="space-y-6">
      {/* Sound Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SpeakerHigh className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Sound Notifications</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Sound</Label>
              <p className="text-xs text-muted-foreground">Play notification sounds</p>
            </div>
            <Switch
              checked={notifications.soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {notifications.soundEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Volume</Label>
                <div className="flex items-center gap-3">
                  <SpeakerX className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[notifications.soundVolume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <SpeakerHigh className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground min-w-[3ch]">
                    {notifications.soundVolume}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Sound Type</Label>
                <div className="flex items-center gap-2">
                  <Select value={notifications.soundType} onValueChange={handleSoundTypeChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestSound}
                    disabled={notifications.soundType === 'none'}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Desktop Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Desktop Notifications</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Desktop Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Show system notifications for new messages
                {!hasNotificationPermission && ' (Permission required)'}
              </p>
            </div>
            <Switch
              checked={notifications.desktopNotifications}
              onCheckedChange={handleDesktopNotificationsToggle}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Notification Triggers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Notification Triggers</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">All Messages</Label>
                <p className="text-xs text-muted-foreground">Notify for every message</p>
              </div>
            </div>
            <Switch
              checked={notifications.allMessages}
              onCheckedChange={(checked) => updateNotifications({ allMessages: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Direct Messages</Label>
                <p className="text-xs text-muted-foreground">Notify for direct messages</p>
              </div>
            </div>
            <Switch
              checked={notifications.directMessages}
              onCheckedChange={(checked) => updateNotifications({ directMessages: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <At className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Mentions</Label>
                <p className="text-xs text-muted-foreground">Notify when someone mentions you</p>
              </div>
            </div>
            <Switch
              checked={notifications.mentions}
              onCheckedChange={(checked) => updateNotifications({ mentions: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Keywords</Label>
            <p className="text-xs text-muted-foreground">Get notified when these words appear in messages</p>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddKeyword()
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {notifications.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {notifications.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Do Not Disturb */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BellSlash className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Do Not Disturb</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Do Not Disturb</Label>
              <p className="text-xs text-muted-foreground">Temporarily disable all notifications</p>
            </div>
            <Switch
              checked={notifications.doNotDisturb}
              onCheckedChange={handleDoNotDisturbToggle}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Do Not Disturb Until</Label>
            <Input
              type="datetime-local"
              value={doNotDisturbUntil}
              onChange={(e) => handleDoNotDisturbUntilChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for indefinite do not disturb
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quiet Hours */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Quiet Hours</h3>
        </div>
        
        <div className="space-y-4 pl-7">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">Automatically disable notifications during specific hours</p>
            </div>
            <Switch
              checked={notifications.quietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
            />
          </div>

          {notifications.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={notifications.quietHours.startTime}
                  onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={notifications.quietHours.endTime}
                  onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Channel Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Channel Settings</h3>
        </div>
        
        <div className="space-y-3 pl-7">
          <p className="text-sm text-muted-foreground">
            Customize notifications for individual channels
          </p>
          
          {channels && channels.length > 0 ? channels.map((channel) => {
            const channelSettings = notifications.channelSettings[channel.id] || { muted: false }
            return (
              <div key={channel.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{channel.name}</span>
                  {channel.description && (
                    <span className="text-xs text-muted-foreground">- {channel.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`mute-${channel.id}`} className="text-sm">
                    {channelSettings.muted ? 'Muted' : 'Active'}
                  </Label>
                  <Switch
                    id={`mute-${channel.id}`}
                    checked={!channelSettings.muted}
                    onCheckedChange={(checked) => handleChannelMuteToggle(channel.id, !checked)}
                  />
                </div>
              </div>
            )
          }) : (
            <div className="text-sm text-muted-foreground py-4">
              No channels available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}