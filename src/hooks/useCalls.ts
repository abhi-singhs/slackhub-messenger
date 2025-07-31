import { useState, useCallback, useRef, useEffect } from 'react'
import { useSupabaseCalls } from './useSupabaseCalls'
import { useAuth } from './useAuth'
import { Call, CallType, CallStatus, CallParticipant, UserInfo, CallRecording } from '@/types'
import { toast } from 'sonner'

export function useCalls(currentUser?: UserInfo) {
  const { user } = useAuth()
  const userToUse = currentUser || user
  
  // If user is authenticated, use Supabase calls
  if (userToUse) {
    return useSupabaseCalls(userToUse)
  }
  
  // Local state for non-authenticated users
  const [localCallHistory, setLocalCallHistory] = useState<Call[]>(() => {
    try {
      const stored = localStorage.getItem('call-history')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  
  const [localCallRecordings, setLocalCallRecordings] = useState<CallRecording[]>(() => {
    try {
      const stored = localStorage.getItem('call-recordings')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [isCallUIOpen, setIsCallUIOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Save to localStorage when local state changes
  useEffect(() => {
    localStorage.setItem('call-history', JSON.stringify(localCallHistory))
  }, [localCallHistory])

  useEffect(() => {
    localStorage.setItem('call-recordings', JSON.stringify(localCallRecordings))
  }, [localCallRecordings])

  // Simplified local implementations for anonymous users
  const startCall = useCallback(async (targetUserId: string, type: CallType = 'voice') => {
    toast.info('Calls are only available for authenticated users')
  }, [])

  const answerCall = useCallback(async () => {
    toast.info('Calls are only available for authenticated users')
  }, [])

  const declineCall = useCallback(async () => {
    setIncomingCall(null)
  }, [])

  const endCall = useCallback(async () => {
    setCurrentCall(null)
    setIsCallUIOpen(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  const toggleVideo = useCallback(() => {
    setHasVideo(prev => !prev)
  }, [])

  const startRecording = useCallback(() => {
    toast.info('Recording is only available for authenticated users')
  }, [])

  const stopRecording = useCallback(async () => {
    setIsRecording(false)
  }, [])

  const deleteRecording = useCallback((recordingId: string) => {
    setLocalCallRecordings(prev => prev.filter(r => r.id !== recordingId))
  }, [])

  return {
    currentCall,
    incomingCall,
    isCallUIOpen,
    callHistory: localCallHistory,
    callRecordings: localCallRecordings,
    localStream,
    remoteStream,
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