import { useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  PhoneSlash, 
  Video, 
  VideoCameraSlash, 
  Microphone, 
  MicrophoneSlash,
  Minus,
  ArrowsOut,
  Record,
  Stop
} from '@phosphor-icons/react'
import { Call, UserInfo } from '@/types'
import { cn } from '@/lib/utils'

interface CallInterfaceProps {
  currentCall: Call | null
  user: UserInfo
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  hasVideo: boolean
  isRecording: boolean
  isOpen: boolean
  onClose: () => void
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  onStartRecording: () => void
  onStopRecording: () => void
}

export function CallInterface({
  currentCall,
  user,
  localStream,
  remoteStream,
  isMuted,
  hasVideo,
  isRecording,
  isOpen,
  onClose,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onStartRecording,
  onStopRecording
}: CallInterfaceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (!currentCall) return null

  const isVideoCall = currentCall.type === 'video'
  const otherParticipant = currentCall.participants[0] || currentCall.initiator
  const callDuration = currentCall.status === 'connected' 
    ? Math.floor((Date.now() - currentCall.startTime) / 1000)
    : 0

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusText = () => {
    switch (currentCall.status) {
      case 'calling':
        return 'Calling...'
      case 'ringing':
        return 'Ringing...'
      case 'connected':
        return formatDuration(callDuration)
      default:
        return currentCall.status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-full h-[600px] p-0 overflow-hidden",
          isVideoCall ? "bg-black" : "bg-card"
        )}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Video Area */}
          {isVideoCall ? (
            <div className="flex-1 relative bg-black">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.avatarUrl} alt={user.login} />
                      <AvatarFallback>{user.login[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
              
              {/* Remote participant info overlay */}
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={otherParticipant.userAvatar} alt={otherParticipant.userName} />
                      <AvatarFallback className="text-2xl">
                        {otherParticipant.userName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-white text-xl font-semibold mb-2">
                      {otherParticipant.userName}
                    </h3>
                    <Badge variant="secondary" className="text-white bg-white/20">
                      {getStatusText()}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Voice Call UI */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <div className="text-center">
                <Avatar className="w-32 h-32 mx-auto mb-6">
                  <AvatarImage src={otherParticipant.userAvatar} alt={otherParticipant.userName} />
                  <AvatarFallback className="text-4xl">
                    {otherParticipant.userName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-2">{otherParticipant.userName}</h2>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {getStatusText()}
                </Badge>
                
                {/* Voice call status indicators */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  {currentCall.status === 'connected' && (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm">Connected</span>
                      </div>
                      {isMuted && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MicrophoneSlash size={16} />
                          <span className="text-sm">Muted</span>
                        </div>
                      )}
                      {isRecording && (
                        <div className="flex items-center gap-2 text-red-500">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm">Recording</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className={cn(
            "p-6 border-t",
            isVideoCall ? "bg-black/80 border-white/20" : "bg-card border-border"
          )}>
            <div className="flex items-center justify-center gap-4">
              {/* Mute/Unmute */}
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="w-14 h-14 rounded-full"
                onClick={onToggleMute}
              >
                {isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
              </Button>

              {/* Video Toggle (only for video calls) */}
              {isVideoCall && (
                <Button
                  variant={hasVideo ? "secondary" : "destructive"}
                  size="lg"
                  className="w-14 h-14 rounded-full"
                  onClick={onToggleVideo}
                >
                  {hasVideo ? <Video size={24} /> : <VideoCameraSlash size={24} />}
                </Button>
              )}

              {/* Recording Toggle - Only show when call is connected */}
              {currentCall.status === 'connected' && (
                <Button
                  variant={isRecording ? "destructive" : "secondary"}
                  size="lg"
                  className={cn(
                    "w-14 h-14 rounded-full",
                    isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""
                  )}
                  onClick={isRecording ? onStopRecording : onStartRecording}
                >
                  {isRecording ? <Stop size={24} /> : <Record size={24} />}
                </Button>
              )}

              {/* End Call */}
              <Button
                variant="destructive"
                size="lg"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                onClick={onEndCall}
              >
                <PhoneSlash size={28} />
              </Button>

              {/* Minimize/Maximize (placeholder for future feature) */}
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  "w-14 h-14 rounded-full",
                  isVideoCall ? "text-white hover:bg-white/20" : ""
                )}
              >
                <Minus size={24} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}