import { useState, useCallback, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Call, CallType, CallStatus, CallParticipant, UserInfo } from '@/types'
import { toast } from 'sonner'

export function useCalls(currentUser?: UserInfo) {
  const [activeCalls, setActiveCalls] = useKV<Call[]>('active-calls', [])
  const [callHistory, setCallHistory] = useKV<Call[]>('call-history', [])
  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [isCallUIOpen, setIsCallUIOpen] = useState(false)
  
  // Media stream references
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)

  // Clean up media streams
  const cleanupStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop())
      remoteStreamRef.current = null
    }
  }, [])

  // Start a call
  const startCall = useCallback(async (
    type: CallType,
    participants: CallParticipant[],
    channelId?: string
  ) => {
    if (!currentUser) {
      toast.error('User not authenticated')
      return null
    }

    try {
      // Request media permissions
      const constraints = {
        audio: true,
        video: type === 'video'
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      setHasVideo(type === 'video')

      const call: Call = {
        id: `call-${Date.now()}`,
        type,
        initiator: {
          userId: currentUser.id,
          userName: currentUser.login,
          userAvatar: currentUser.avatarUrl,
          status: 'active',
          isMuted: false,
          hasVideo: type === 'video'
        },
        participants,
        status: 'calling',
        startTime: Date.now(),
        channelId
      }

      setCurrentCall(call)
      setIsCallUIOpen(true)
      
      // Add to active calls
      setActiveCalls(prev => [...prev, call])
      
      // Simulate call ringing (in real app, this would be handled by signaling server)
      setTimeout(() => {
        setCurrentCall(prev => prev ? { ...prev, status: 'ringing' } : null)
      }, 1000)

      toast.success(`${type === 'video' ? 'Video' : 'Voice'} call started`)
      return call.id
      
    } catch (error) {
      toast.error('Failed to access camera/microphone')
      console.error('Error starting call:', error)
      return null
    }
  }, [currentUser, setActiveCalls])

  // Answer an incoming call
  const answerCall = useCallback(async (callId: string) => {
    const call = activeCalls.find(c => c.id === callId)
    if (!call) return

    try {
      const constraints = {
        audio: true,
        video: call.type === 'video'
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      setHasVideo(call.type === 'video')

      const updatedCall = { 
        ...call, 
        status: 'connected' as CallStatus 
      }
      
      setCurrentCall(updatedCall)
      setIncomingCall(null)
      setIsCallUIOpen(true)
      
      // Update active calls
      setActiveCalls(prev => prev.map(c => c.id === callId ? updatedCall : c))
      
      toast.success('Call connected')
      
    } catch (error) {
      toast.error('Failed to access camera/microphone')
      console.error('Error answering call:', error)
    }
  }, [activeCalls, setActiveCalls])

  // Decline a call
  const declineCall = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId)
    if (!call) return

    const endedCall = { 
      ...call, 
      status: 'declined' as CallStatus,
      endTime: Date.now()
    }
    
    setIncomingCall(null)
    
    // Remove from active calls and add to history
    setActiveCalls(prev => prev.filter(c => c.id !== callId))
    setCallHistory(prev => [endedCall, ...prev])
    
    toast.info('Call declined')
  }, [activeCalls, setActiveCalls, setCallHistory])

  // End current call
  const endCall = useCallback(() => {
    if (!currentCall) return

    const endedCall = { 
      ...currentCall, 
      status: 'ended' as CallStatus,
      endTime: Date.now()
    }
    
    setCurrentCall(null)
    setIsCallUIOpen(false)
    cleanupStreams()
    setIsMuted(false)
    setHasVideo(false)
    
    // Remove from active calls and add to history
    setActiveCalls(prev => prev.filter(c => c.id !== currentCall.id))
    setCallHistory(prev => [endedCall, ...prev.slice(0, 49)]) // Keep last 50 calls
    
    toast.info('Call ended')
  }, [currentCall, setActiveCalls, setCallHistory, cleanupStreams])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !hasVideo
      })
      setHasVideo(!hasVideo)
    }
  }, [hasVideo])

  // Simulate incoming calls (in real app, this would come from signaling server)
  useEffect(() => {
    if (!currentUser) return

    const checkForIncomingCalls = () => {
      const newIncomingCall = activeCalls.find(call => 
        call.status === 'calling' && 
        call.initiator.userId !== currentUser.id &&
        call.participants.some(p => p.userId === currentUser.id)
      )
      
      if (newIncomingCall && !incomingCall) {
        setIncomingCall(newIncomingCall)
        toast.info(`Incoming ${newIncomingCall.type} call from ${newIncomingCall.initiator.userName}`)
      }
    }

    const interval = setInterval(checkForIncomingCalls, 1000)
    return () => clearInterval(interval)
  }, [activeCalls, currentUser, incomingCall])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStreams()
    }
  }, [cleanupStreams])

  return {
    currentCall,
    incomingCall,
    isCallUIOpen,
    callHistory,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    isMuted,
    hasVideo,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    setIsCallUIOpen
  }
}