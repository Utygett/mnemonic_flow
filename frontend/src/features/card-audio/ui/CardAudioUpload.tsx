import { useRef, ChangeEvent, useState, useEffect } from 'react'
import { Upload, X, Volume2 as VolumeIcon, Loader2, Mic, Plus } from 'lucide-react'

import type { CardAudioUploadProps } from '../model/types'
import { useCardAudioUpload } from '../model/useCardAudioUpload'

import styles from './CardAudioUpload.module.css'

export function CardAudioUpload({
  cardId,
  levelIndex,
  side,
  currentAudioUrls,
  onAudiosChange,
}: CardAudioUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    uploadAudio,
    deleteAudio,
    isUploading,
    error: uploadError,
  } = useCardAudioUpload({
    cardId,
    levelIndex,
    side,
  })
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const displayUrls = [...previewUrls, ...(currentAudioUrls || [])]

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrls(prev => [...prev, url])

      const result = await uploadAudio(file)
      // Notify parent of new URLs so it can update its state
      onAudiosChange?.(result.audioUrls)
      // After successful upload, clear preview to let actual URL come from props
      URL.revokeObjectURL(url)
      setTimeout(() => {
        setPreviewUrls([])
      }, 100)
    } catch (err) {
      console.error('Upload error:', err)
      setPreviewUrls([])
    }
  }

  const handleDelete = async (index: number) => {
    try {
      await deleteAudio(index)
      // Update local state by removing the deleted audio from the current URLs
      const newUrls = [...(currentAudioUrls || [])]
      newUrls.splice(index, 1)
      onAudiosChange?.(newUrls.length > 0 ? newUrls : undefined)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Determine supported MIME type for recording
      // Chrome/Firefox: audio/webm, Safari: audio/mp4
      let mimeType = 'audio/webm'
      let fileExtension = 'webm'

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'
        fileExtension = 'm4a'
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const audioFile = new File([audioBlob], `recording.${fileExtension}`, { type: mimeType })

        try {
          // Create preview URL for immediate playback
          const previewUrl = URL.createObjectURL(audioBlob)
          setPreviewUrls(prev => [...prev, previewUrl])

          const result = await uploadAudio(audioFile)
          // Notify parent of new URLs so it can update its state
          onAudiosChange?.(result.audioUrls)

          // Clean up preview URL and switch to server URL
          URL.revokeObjectURL(previewUrl)

          // After successful upload, clear preview to let actual URL come from props
          setTimeout(() => {
            setPreviewUrls([])
          }, 100)
        } catch (err) {
          console.error('Upload recording error:', err)
          setError('Failed to upload recording')
          setPreviewUrls([])
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

      {displayUrls.length > 0 && (
        <div className={styles.audioList}>
          {displayUrls.map((url, index) => (
            <div key={index} className={styles.audioWrapper}>
              <audio src={url} controls className={styles.audioPlayer} data-testid="audio-player" />
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className={styles.deleteButton}
                  title="Remove audio"
                >
                  <X size={16} />
                </button>
              )}
              {isUploading && index === displayUrls.length - 1 && (
                <div className={styles.overlay}>
                  <Loader2 size={32} className={styles.spinner} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {(error || uploadError) && <div className={styles.error}>{error || uploadError}</div>}
      <div className={styles.hint}>Max 10MB per file. MP3, M4A, WAV, WebM, OGG. Max 10 files.</div>
    </div>
  )
}
