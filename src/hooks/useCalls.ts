import { useState, useCallback, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Call, CallType, CallStatus, CallParticipant, UserInfo, CallRecording } from '@/types'
import { toast } from 'sonner'

export function useCalls(currentUser?: UserInfo) {
  const [activeCalls, setActiveCalls] = useKV<Call[]>('active-calls', [])
  const [callHistory, setCallHistory] = useKV<Call[]>('call-history', [])
  const [callRecordings, setCallRecordings] = useKV<CallRecording[]>('call-recordings', [])
  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [isCallUIOpen, setIsCallUIOpen] = useState(false)
  
  // Media stream references
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!currentCall || !localStreamRef.current) {
      toast.error('No active call to record')
      return
    }

    try {
      // Create a combined stream for recording (local + remote audio)
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()
      
      // Add local audio
      if (localStreamRef.current.getAudioTracks().length > 0) {
        const localSource = audioContext.createMediaStreamSource(localStreamRef.current)
        localSource.connect(destination)
      }
      
      // Add remote audio (simulated - in real app this would be the actual remote stream)
      if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
        const remoteSource = audioContext.createMediaStreamSource(remoteStreamRef.current)
        remoteSource.connect(destination)
      }

      const recordingStream = destination.stream
      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      recordingChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const recordingBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        saveRecording(recordingBlob)
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      
      // Update current call to reflect recording state
      setCurrentCall(prev => prev ? { ...prev, isRecording: true } : null)
      setActiveCalls(prev => prev.map(call => 
        call.id === currentCall.id ? { ...call, isRecording: true } : call
      ))
      
      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }, [currentCall, setActiveCalls])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      return
    }

    mediaRecorderRef.current.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
    
    // Update current call to reflect recording stopped
    setCurrentCall(prev => prev ? { ...prev, isRecording: false } : null)
    setActiveCalls(prev => prev.map(call => 
      call.id === currentCall?.id ? { ...call, isRecording: false } : call
    ))
    
    toast.success('Recording stopped')
  }, [isRecording, currentCall?.id, setActiveCalls])

  // Save recording
  const saveRecording = useCallback((audioBlob: Blob) => {
    if (!currentCall) return

    const recording: CallRecording = {
      id: `recording-${Date.now()}`,
      callId: currentCall.id,
      audioBlob,
      duration: currentCall.endTime ? 
        Math.floor((currentCall.endTime - currentCall.startTime) / 1000) : 
        Math.floor((Date.now() - currentCall.startTime) / 1000),
      size: audioBlob.size,
      timestamp: Date.now(),
      participants: [currentCall.initiator.userName, ...currentCall.participants.map(p => p.userName)],
      callType: currentCall.type
    }

    setCallRecordings(prev => [recording, ...prev.slice(0, 99)]) // Keep last 100 recordings
    
    // Update call history with recording reference
    setCallHistory(prev => prev.map(call => 
      call.id === currentCall.id ? { ...call, recording } : call
    ))
    
    toast.success('Recording saved successfully')
  }, [currentCall, setCallRecordings, setCallHistory])

  // Delete recording
  const deleteRecording = useCallback((recordingId: string) => {
    setCallRecordings(prev => prev.filter(r => r.id !== recordingId))
    
    // Also remove from call history
    setCallHistory(prev => prev.map(call => 
      call.recording?.id === recordingId ? { ...call, recording: undefined } : call
    ))
    
    toast.success('Recording deleted')
  }, [setCallRecordings, setCallHistory])

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

    // Stop recording if active
    if (isRecording) {
      stopRecording()
    }

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
    setIsRecording(false)
    
    // Remove from active calls and add to history
    setActiveCalls(prev => prev.filter(c => c.id !== currentCall.id))
    setCallHistory(prev => [endedCall, ...prev.slice(0, 49)]) // Keep last 50 calls
    
    toast.info('Call ended')
  }, [currentCall, isRecording, stopRecording, setActiveCalls, setCallHistory, cleanupStreams])

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
    callRecordings,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    isMuted,
    hasVideo,
    isRecording,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    startRecording,
    stopRecording,
    deleteRecording,
    setIsCallUIOpen
  }
}