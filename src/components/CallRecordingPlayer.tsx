import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Play, Pause, Download, SpeakerX, SpeakerHigh, X } from '@phosphor-icons/react'
import { CallRecording } from '@/types'
import { formatDate, formatFileSize } from '@/lib/utils'

interface CallRecordingPlayerProps {
  recording: CallRecording
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
}

export function CallRecordingPlayer({ 
  recording, 
  isOpen, 
  onClose,
  onDownload 
}: CallRecordingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Create audio URL when component mounts
  useEffect(() => {
    if (recording.audioBlob) {
      audioUrlRef.current = URL.createObjectURL(recording.audioBlob)
    }
    
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [recording.audioBlob])

  // Setup event listeners for audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleLoadedMetadata = () => {
      // Audio is ready to play
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  // Update audio properties when they change
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Reset playback state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Call Recording</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recording Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              {recording.participants.join(', ')}
            </h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{formatDate(recording.timestamp)} • {recording.callType} call</p>
              <p>{Math.floor(recording.duration / 60)}m {recording.duration % 60}s • {formatFileSize(recording.size)}</p>
            </div>
          </div>

          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrlRef.current || undefined}
            preload="metadata"
          />

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={recording.duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(recording.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            {/* Play/Pause */}
            <Button
              variant="outline"
              size="lg"
              className="w-14 h-14 rounded-full"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={handleMuteToggle}
            >
              {isMuted ? <SpeakerX size={16} /> : <SpeakerHigh size={16} />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>

          {/* Download Button */}
          {onDownload && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onDownload}
            >
              <Download size={16} className="mr-2" />
              Download Recording
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}