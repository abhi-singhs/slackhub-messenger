import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Hash, Plus, List, X, DotsThree, PencilSimple, Trash, Gear, Keyboard, SignOut } from '@phosphor-icons/react'
import { Channel, UserInfo, UserStatus } from '@/types'
import { getChannelUnreadCount } from '@/lib/utils'
import { StatusIndicator } from '@/components/StatusIndicator'
import { StatusSelector } from '@/components/StatusSelector'
import { SettingsModal } from '@/components/SettingsModal'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

import { OnlineUsersList } from '@/components/OnlineUsersList'

interface PresenceUser {
  userId: string
  userName: string
  userAvatar: string
  status: UserStatus
  lastSeen: number
}

interface SidebarProps {
  user: UserInfo | null
  channels: Channel[]
  currentChannel: string
  messages: any[]
  lastReadTimestamps: Record<string, number>
  sidebarOpen: boolean
  userStatus: UserStatus
  onChannelSelect: (channelId: string) => void
  onChannelCreate: (name: string) => void
  onChannelUpdate: (channelId: string, name: string, description: string) => void
  onChannelDelete: (channelId: string) => void
  onSidebarToggle: (open: boolean) => void
  onStatusChange: (status: UserStatus) => void
  onShowKeyboardShortcuts?: () => void
  // Theme management props
  settings?: {
    theme: 'light' | 'dark'
    colorTheme: string
    notifications: any
  }
  updateTheme?: (theme: 'light' | 'dark') => void
  updateColorTheme?: (theme: string) => void
  updateNotificationSettings?: (settings: any) => void
  // Presence props
  onlineUsers?: PresenceUser[]
  channelPresence?: PresenceUser[]
}

export const Sidebar = ({
  user,
  channels,
  currentChannel,
  messages,
  lastReadTimestamps,
  sidebarOpen,
  userStatus,
  onChannelSelect,
  onChannelCreate,
  onChannelUpdate,
  onChannelDelete,
  onSidebarToggle,
  onStatusChange,
  onShowKeyboardShortcuts,
  // Theme management props
  settings,
  updateTheme,
  updateColorTheme,
  updateNotificationSettings,
  // Presence props
  onlineUsers,
  channelPresence
}: SidebarProps) => {
  const { signOut } = useAuth()
  const [newChannelName, setNewChannelName] = useState('')
  const [showChannelInput, setShowChannelInput] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [editChannelName, setEditChannelName] = useState('')
  const [editChannelDescription, setEditChannelDescription] = useState('')
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null)
  const [openMenuChannel, setOpenMenuChannel] = useState<string | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) return
    
    onChannelCreate(newChannelName.trim())
    setNewChannelName('')
    setShowChannelInput(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateChannel()
    }
  }

  const handleEditChannel = (channel: Channel) => {
    // Find the current channel data to ensure we have the latest name
    const currentChannelData = channels?.find(c => c.id === channel.id) || channel
    setEditingChannel(currentChannelData)
    setEditChannelName(currentChannelData.name)
    setEditChannelDescription(currentChannelData.description || '')
  }

  const handleUpdateChannel = () => {
    if (!editingChannel || !editChannelName.trim()) return
    
    onChannelUpdate(editingChannel.id, editChannelName.trim(), editChannelDescription.trim())
    setEditingChannel(null)
    setEditChannelName('')
    setEditChannelDescription('')
  }

  const handleDeleteChannel = (channelId: string) => {
    onChannelDelete(channelId)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const handleChannelClick = (channelId: string, e: React.MouseEvent) => {
    // Prevent channel selection if clicking on the menu button or its children
    const target = e.target as HTMLElement
    
    // Check if the click is on the menu trigger or inside the dropdown menu
    if (target.closest('[data-menu-trigger]') || 
        target.closest('.dropdown-menu') ||
        target.hasAttribute('data-menu-trigger')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Proceed with channel selection
    onChannelSelect(channelId)
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => onSidebarToggle(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        fixed md:relative
        z-50 md:z-auto
        w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-300 ease-in-out
        h-full
      `}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Slack Clone</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSidebarToggle(false)}
              className="h-8 w-8 p-0 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="w-6 h-6" showOnlineIndicator={true}>
              <AvatarImage 
                src={user?.avatarUrl || ''} 
                alt={user?.login || 'User'} 
                showOnlineIndicator={true}
                status={userStatus !== 'offline' ? userStatus : undefined}
              />
              <AvatarFallback>{user?.login?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 justify-start text-sm text-muted-foreground hover:text-foreground"
                  >
                    {user?.login || 'Loading...'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <SignOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <StatusSelector currentStatus={userStatus} onStatusChange={onStatusChange} />
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Channels</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChannelInput(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showChannelInput && (
              <div className="mb-3">
                <Input
                  placeholder="Channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onBlur={() => {
                    if (!newChannelName.trim()) {
                      setShowChannelInput(false)
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-0 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {(channels || []).map((channel) => (
                  <div
                    key={channel.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredChannel(channel.id)}
                    onMouseLeave={() => setHoveredChannel(null)}
                  >
                    <div
                      onClick={(e) => handleChannelClick(channel.id, e)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                        currentChannel === channel.id
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                      }`}
                    >
                      <Hash className="h-4 w-4" />
                      <span className="flex-1 text-left">{channel.name}</span>
                      {getChannelUnreadCount(channel.id, messages, lastReadTimestamps) > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`h-5 text-xs transition-all duration-200 ease-in-out ${
                            openMenuChannel === channel.id 
                              ? 'translate-x-[-2rem] opacity-0' 
                              : 'translate-x-0 opacity-100'
                          }`}
                        >
                          {getChannelUnreadCount(channel.id, messages, lastReadTimestamps)}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Three-dot menu - show on hover or when menu is open, but not for general channel */}
                    {(hoveredChannel === channel.id || openMenuChannel === channel.id) && channel.id !== 'general' && (
                      <DropdownMenu onOpenChange={(open) => setOpenMenuChannel(open ? channel.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 transition-all duration-200 ease-in-out hover:bg-secondary/80 ${
                              openMenuChannel === channel.id 
                                ? 'opacity-100 translate-x-0' 
                                : hoveredChannel === channel.id
                                  ? 'opacity-100 translate-x-0'
                                  : 'opacity-0 translate-x-2'
                            }`}
                            data-menu-trigger
                          >
                            <DotsThree className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditChannel(channel)}>
                            <PencilSimple className="h-4 w-4 mr-2" />
                            Edit channel
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Online Users Section */}
        <div className="border-t border-border flex-shrink-0">
          <OnlineUsersList 
            onlineUsers={onlineUsers || []}
            channelPresence={channelPresence}
            currentChannel={currentChannel}
          />
        </div>

        {/* Settings Section */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => onShowKeyboardShortcuts?.()}
            >
              <Keyboard className="h-4 w-4" />
              Shortcuts
            </Button>
            
            <SettingsModal
              user={user}
              channels={channels}
              open={settingsModalOpen}
              onOpenChange={setSettingsModalOpen}
              settings={settings}
              updateTheme={updateTheme}
              updateColorTheme={updateColorTheme}
              updateNotificationSettings={updateNotificationSettings}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <Gear className="h-4 w-4" />
                  Settings
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Edit Channel Dialog */}
      <Dialog open={!!editingChannel} onOpenChange={() => setEditingChannel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
                placeholder="Channel name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description</Label>
              <Textarea
                id="channel-description"
                value={editChannelDescription}
                onChange={(e) => setEditChannelDescription(e.target.value)}
                placeholder="Channel description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChannel(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateChannel}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}