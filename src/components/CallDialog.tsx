import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, Video, Search, Clock } from '@phosphor-icons/react'
import { Call, CallParticipant, UserInfo, Channel } from '@/types'
import { cn, formatDate } from '@/lib/utils'

interface CallDialogProps {
  user: UserInfo
  channels: Channel[]
  callHistory: Call[]
  onStartCall: (type: 'voice' | 'video', participants: CallParticipant[], channelId?: string) => void
  children: React.ReactNode
}

export function CallDialog({ 
  user, 
  channels, 
  callHistory, 
  onStartCall, 
  children 
}: CallDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<'contacts' | 'history'>('contacts')

  // Mock contacts from channel members (in real app, this would be a proper contacts list)
  const contacts = channels.flatMap(channel => 
    // For demo purposes, we'll create mock participants
    [
      {
        userId: 'user-1',
        userName: 'Alice Johnson',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        status: 'active' as const
      },
      {
        userId: 'user-2', 
        userName: 'Bob Smith',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        status: 'away' as const
      },
      {
        userId: 'user-3',
        userName: 'Carol Davis',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        status: 'busy' as const
      }
    ]
  ).filter((contact, index, self) => 
    contact.userId !== user.id && // Exclude current user
    index === self.findIndex(c => c.userId === contact.userId) // Remove duplicates
  )

  const filteredContacts = contacts.filter(contact =>
    contact.userName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredHistory = callHistory.filter(call =>
    call.initiator.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.participants.some(p => p.userName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleStartCall = (type: 'voice' | 'video', participant: CallParticipant) => {
    onStartCall(type, [participant])
  }

  const getCallStatusColor = (status: Call['status']) => {
    switch (status) {
      case 'connected':
      case 'ended':
        return 'text-green-600'
      case 'declined':
        return 'text-red-600'
      case 'missed':
        return 'text-yellow-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusIndicatorColor = (status: CallParticipant['status']) => {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Start a Call</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col px-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search contacts or history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <div className="flex mb-4">
            <Button
              variant={selectedTab === 'contacts' ? 'default' : 'ghost'}
              className="rounded-r-none"
              onClick={() => setSelectedTab('contacts')}
            >
              Contacts
            </Button>
            <Button
              variant={selectedTab === 'history' ? 'default' : 'ghost'}
              className="rounded-l-none"
              onClick={() => setSelectedTab('history')}
            >
              <Clock size={16} className="mr-2" />
              History
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {selectedTab === 'contacts' ? (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.userId}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contact.userAvatar} alt={contact.userName} />
                          <AvatarFallback>
                            {contact.userName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                          getStatusIndicatorColor(contact.status)
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{contact.userName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {contact.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => handleStartCall('voice', contact)}
                      >
                        <Phone size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => handleStartCall('video', contact)}
                      >
                        <Video size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredContacts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No contacts found' : 'No contacts available'}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((call) => {
                  const otherParticipant = call.initiator.userId === user.id 
                    ? call.participants[0] 
                    : call.initiator
                    
                  return (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherParticipant?.userAvatar} alt={otherParticipant?.userName} />
                          <AvatarFallback>
                            {otherParticipant?.userName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{otherParticipant?.userName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {call.type === 'video' ? <Video size={12} /> : <Phone size={12} />}
                            <span className={getCallStatusColor(call.status)}>
                              {call.status}
                            </span>
                            <span>•</span>
                            <span>{formatDate(call.startTime)}</span>
                            {call.endTime && (
                              <>
                                <span>•</span>
                                <span>
                                  {Math.floor((call.endTime - call.startTime) / 1000 / 60)}m
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {otherParticipant && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-9 h-9 p-0"
                            onClick={() => handleStartCall('voice', otherParticipant)}
                          >
                            <Phone size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-9 h-9 p-0"
                            onClick={() => handleStartCall('video', otherParticipant)}
                          >
                            <Video size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {filteredHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No call history found' : 'No call history'}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}