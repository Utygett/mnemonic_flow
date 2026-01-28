import { useRef, ChangeEvent, useState, useEffect } from 'react'
import { Upload, X, Volume2 as VolumeIcon, Loader2, Mic } from 'lucide-react'

import type { CardAudioUploadProps } from '../model/types'
import { useCardAudioUpload } from '../model/useCardAudioUpload'

import styles from './CardAudioUpload.module.css'

export function CardAudioUpload({
  cardId,
  levelIndex,
  side,
  currentAudioUrl,
  onAudioChange,
}: CardAudioUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadAudio, deleteAudio, isUploading, error } = useCardAudioUpload({
    cardId,
    levelIndex,
    side,
  })
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const displayUrl = audioUrl || currentAudioUrl || null

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create preview URL
      const url = URL.createObjectURL(file)
      setAudioUrl(url)

      const result = await uploadAudio(file)
      onAudioChange?.(result.audioUrl)
      URL.revokeObjectURL(url)
      setAudioUrl(null)
    } catch (err) {
      console.error('Upload error:', err)
      setAudioUrl(null)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAudio()
      setAudioUrl(null)
      onAudioChange?.(undefined)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })

        try {
          const url = URL.createObjectURL(audioBlob)
          setAudioUrl(url)

          const result = await uploadAudio(audioFile)
          onAudioChange?.(result.audioUrl)
          URL.revokeObjectURL(url)
          setAudioUrl(null)
        } catch (err) {
          console.error('Upload recording error:', err)
          setAudioUrl(null)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access error:', err)
      setError('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sideLabel = side === 'question' ? 'Question' : 'Answer'

  return (
    <div className={styles.container}>
      <div className={styles.label}>{sideLabel} Audio</div>

      {displayUrl ? (
        <div className={styles.audioWrapper}>
          <audio src={displayUrl} controls className={styles.audioPlayer} />
          {!isUploading && (
            <button
              type="button"
              onClick={handleDelete}
              className={styles.deleteButton}
              title="Remove audio"
            >
              <X size={16} />
            </button>
          )}
          {isUploading && (
            <div className={styles.overlay}>
              <Loader2 size={32} className={styles.spinner} />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.uploadRow}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRecording}
            className={styles.uploadButton}
          >
            {isUploading ? <Loader2 size={20} className={styles.spinner} /> : <Upload size={20} />}
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
          >
            <Mic size={20} />
            <span>{isRecording ? 'Stop' : 'Record'}</span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.hint}>Max 10MB. MP3, M4A, WAV, WebM, OGG</div>
    </div>
  )
}
