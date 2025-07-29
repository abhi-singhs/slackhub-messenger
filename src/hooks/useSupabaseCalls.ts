import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { UserInfo, Call, CallRecording, CallParticipant, CallType, CallStatus } from '@/types'
import { toast } from 'sonner'

export const useSupabaseCalls = (user: UserInfo | null) => {
  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [callHistory, setCallHistory] = useState<Call[]>([])
  const [callRecordings, setCallRecordings] = useState<CallRecording[]>([])
  const [isCallUIOpen, setIsCallUIOpen] = useState(false)
  
  // WebRTC state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // WebRTC refs
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])

  // Fetch call history
  const fetchCallHistory = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .or(`initiator_id.eq.${user.id},participants.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedCalls: Call[] = data.map(call => ({
        id: call.id,
        type: call.type as CallType,
        initiator: {
          userId: call.initiator_id,
          userName: 'Unknown', // Would need to join with users table
          userAvatar: '',
          status: 'active'
        } as CallParticipant,
        participants: call.participants.map(p => ({
          userId: p,
          userName: 'Unknown',
          userAvatar: '',
          status: 'active'
        } as CallParticipant)),
        status: call.status as CallStatus,
        startTime: new Date(call.start_time).getTime(),
        endTime: call.end_time ? new Date(call.end_time).getTime() : undefined,
        channelId: call.channel_id || undefined,
        recording: call.recording_url ? {
          id: call.id + '-recording',
          callId: call.id,
          audioBlob: new Blob(), // Would need to fetch from storage
          duration: 0,
          size: 0,
          timestamp: new Date(call.start_time).getTime(),
          participants: call.participants,
          callType: call.type as CallType
        } : undefined
      }))

      setCallHistory(formattedCalls)
    } catch (error) {
      console.error('Error fetching call history:', error)
    }
  }, [user])

  // Initialize WebRTC
  const initializePeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    }

    peerConnection.current = new RTCPeerConnection(configuration)

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the other peer
        console.log('ICE candidate:', event.candidate)
      }
    }

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0])
    }

    return peerConnection.current
  }, [])

  // Get user media
  const getUserMedia = useCallback(async (video: boolean = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video
      })
      
      setLocalStream(stream)
      setHasVideo(video)
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      toast.error('Could not access camera/microphone')
      return null
    }
  }, [])

  // Start a call
  const startCall = useCallback(async (targetUserId: string, type: CallType = 'voice') => {
    if (!user) return

    try {
      // Get user media
      const stream = await getUserMedia(type === 'video')
      if (!stream) return

      // Create call record
      const { data: callData, error } = await supabase
        .from('calls')
        .insert({
          type,
          initiator_id: user.id,
          participants: [user.id, targetUserId],
          status: 'calling',
          start_time: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      const call: Call = {
        id: callData.id,
        type,
        initiator: {
          userId: user.id,
          userName: user.login,
          userAvatar: user.avatarUrl,
          status: 'active'
        },
        participants: [
          {
            userId: user.id,
            userName: user.login,
            userAvatar: user.avatarUrl,
            status: 'active'
          },
          {
            userId: targetUserId,
            userName: 'Unknown',
            userAvatar: '',
            status: 'active'
          }
        ],
        status: 'calling',
        startTime: Date.now()
      }

      setCurrentCall(call)
      setIsCallUIOpen(true)

      // Initialize WebRTC
      const pc = initializePeerConnection()
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      toast.success('Call started')
    } catch (error) {
      console.error('Error starting call:', error)
      toast.error('Failed to start call')
    }
  }, [user, getUserMedia, initializePeerConnection])

  // Answer call
  const answerCall = useCallback(async () => {
    if (!incomingCall || !user) return

    try {
      // Get user media
      const stream = await getUserMedia(incomingCall.type === 'video')
      if (!stream) return

      // Update call status
      await supabase
        .from('calls')
        .update({ status: 'connected' })
        .eq('id', incomingCall.id)

      setCurrentCall({ ...incomingCall, status: 'connected' })
      setIncomingCall(null)
      setIsCallUIOpen(true)

      // Initialize WebRTC
      const pc = initializePeerConnection()
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      toast.success('Call connected')
    } catch (error) {
      console.error('Error answering call:', error)
      toast.error('Failed to answer call')
    }
  }, [incomingCall, user, getUserMedia, initializePeerConnection])

  // Decline call
  const declineCall = useCallback(async () => {
    if (!incomingCall) return

    try {
      await supabase
        .from('calls')
        .update({ 
          status: 'declined',
          end_time: new Date().toISOString()
        })
        .eq('id', incomingCall.id)

      setIncomingCall(null)
      toast.info('Call declined')
    } catch (error) {
      console.error('Error declining call:', error)
    }
  }, [incomingCall])

  // End call
  const endCall = useCallback(async () => {
    if (!currentCall) return

    try {
      await supabase
        .from('calls')
        .update({ 
          status: 'ended',
          end_time: new Date().toISOString()
        })
        .eq('id', currentCall.id)

      // Clean up media
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop())
        setRemoteStream(null)
      }

      // Clean up peer connection
      if (peerConnection.current) {
        peerConnection.current.close()
        peerConnection.current = null
      }

      // Stop recording if active
      if (isRecording) {
        await stopRecording()
      }

      setCurrentCall(null)
      setIsCallUIOpen(false)
      setIsMuted(false)
      setHasVideo(false)

      toast.info('Call ended')
      
      // Refresh call history
      fetchCallHistory()
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }, [currentCall, localStream, remoteStream, isRecording, fetchCallHistory])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!localStream) return

    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsMuted(!audioTrack.enabled)
    }
  }, [localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) return

    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setHasVideo(videoTrack.enabled)
    }
  }, [localStream])

  // Start recording
  const startRecording = useCallback(() => {
    if (!localStream || isRecording) return

    try {
      recordedChunks.current = []
      mediaRecorder.current = new MediaRecorder(localStream, {
        mimeType: 'audio/webm'
      })

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'audio/webm' })
        
        // Create recording record
        const recording: CallRecording = {
          id: Date.now().toString(),
          callId: currentCall?.id || '',
          audioBlob: blob,
          duration: 0, // Would calculate from start/end times
          size: blob.size,
          timestamp: Date.now(),
          participants: currentCall?.participants.map(p => p.userName) || [],
          callType: currentCall?.type || 'voice'
        }

        setCallRecordings(prev => [...prev, recording])
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }, [localStream, isRecording, currentCall])

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!mediaRecorder.current || !isRecording) return

    try {
      mediaRecorder.current.stop()
      setIsRecording(false)
      toast.success('Recording stopped')
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }, [isRecording])

  // Delete recording
  const deleteRecording = useCallback((recordingId: string) => {
    setCallRecordings(prev => prev.filter(r => r.id !== recordingId))
    toast.success('Recording deleted')
  }, [])

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchCallHistory()
    }
  }, [user, fetchCallHistory])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel(`calls-${user.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `participants.cs.{${user.id}}`
        },
        (payload) => {
          const call = payload.new as any
          
          if (call.status === 'calling' && call.initiator_id !== user.id) {
            // Incoming call
            const incomingCallData: Call = {
              id: call.id,
              type: call.type,
              initiator: {
                userId: call.initiator_id,
                userName: 'Unknown',
                userAvatar: '',
                status: 'active'
              },
              participants: call.participants.map((p: string) => ({
                userId: p,
                userName: 'Unknown',
                userAvatar: '',
                status: 'active'
              })),
              status: call.status,
              startTime: new Date(call.start_time).getTime()
            }
            
            setIncomingCall(incomingCallData)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user])

  return {
    currentCall,
    incomingCall,
    isCallUIOpen,
    callHistory,
    callRecordings,
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