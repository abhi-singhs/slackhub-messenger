import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneSlash, Video } from '@phosphor-icons/react'
import { Call } from '@/types'

interface IncomingCallDialogProps {
  incomingCall: Call | null
  onAnswer: (callId: string) => void
  onDecline: (callId: string) => void
}

export function IncomingCallDialog({ 
  incomingCall, 
  onAnswer, 
  onDecline 
}: IncomingCallDialogProps) {
  if (!incomingCall) return null

  const caller = incomingCall.initiator

  return (
    <Dialog open={!!incomingCall}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-6">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage src={caller.userAvatar} alt={caller.userName} />
            <AvatarFallback className="text-2xl">
              {caller.userName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-xl font-semibold mb-2">{caller.userName}</h3>
          
          <Badge variant="secondary" className="mb-6">
            {incomingCall.type === 'video' ? 'Video Call' : 'Voice Call'}
          </Badge>
          
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="destructive"
              size="lg"
              className="w-16 h-16 rounded-full"
              onClick={() => onDecline(incomingCall.id)}
            >
              <PhoneSlash size={28} />
            </Button>
            
            <Button
              variant="default"
              size="lg"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
              onClick={() => onAnswer(incomingCall.id)}
            >
              {incomingCall.type === 'video' ? <Video size={28} /> : <Phone size={28} />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}