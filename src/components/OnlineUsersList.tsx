import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'
import { UserStatus } from '@/types'

interface PresenceUser {
  userId: string
  userName: string
  userAvatar: string
  status: UserStatus
  lastSeen: number
}

interface OnlineUsersListProps {
  onlineUsers: PresenceUser[]
  channelPresence?: PresenceUser[]
  currentChannel?: string
}

export const OnlineUsersList = ({ onlineUsers, channelPresence, currentChannel }: OnlineUsersListProps) => {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'away':
        return 'Away'
      case 'busy':
        return 'Busy'
      default:
        return 'Offline'
    }
  }

  const formatLastSeen = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  // Show channel presence if available, otherwise global online users
  const usersToShow = channelPresence && channelPresence.length > 0 ? channelPresence : onlineUsers

  if (!usersToShow || usersToShow.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">No users online</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {channelPresence && channelPresence.length > 0 ? 'In this channel' : 'Online'}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {usersToShow.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {usersToShow.map((user) => (
            <TooltipProvider key={user.userId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={user.userAvatar || ''} 
                          alt={user.userName} 
                        />
                        <AvatarFallback className="text-xs">
                          {user.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(user.status)}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.status === 'active' ? 'Active now' : `Last seen ${formatLastSeen(user.lastSeen)}`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
