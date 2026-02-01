import { useCallback, useState } from 'react'
import { apiRequest } from '@/shared/api'

import type { UploadAudioResult } from './types'

export interface UseCardAudioUploadOptions {
  cardId: string
  levelIndex: number
  side: 'question' | 'answer'
}

export function useCardAudioUpload({ cardId, levelIndex, side }: UseCardAudioUploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg']

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only MP3, M4A, WAV, WebM, and OGG audio files are allowed'
    }

    if (file.size > MAX_SIZE) {
      return 'File size must be less than 10MB'
    }

    return null
  }, [])

  const uploadAudio = useCallback(
    async (file: File): Promise<UploadAudioResult> => {
      const validationError = validateFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      setIsUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const endpoint = side === 'question' ? '/question-audio' : '/answer-audio'
        const result = await apiRequest<UploadAudioResult>(
          `/cards/${cardId}/levels/${levelIndex}${endpoint}`,
          {
            method: 'POST',
            headers: {}, // Let browser set Content-Type with boundary
            body: formData,
          }
        )

        // The API returns CardLevelContent, extract the audio URLs
        const cardLevel = result as unknown as {
          question_audio_urls?: string[]
          answer_audio_urls?: string[]
        }
        const audioUrls =
          side === 'question' ? cardLevel.question_audio_urls : cardLevel.answer_audio_urls

        return {
          audioUrls: audioUrls || [], // Return the full array of URLs
          audioName: file.name,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [cardId, levelIndex, side, validateFile]
  )

  const deleteAudio = useCallback(
    async (index: number) => {
      setIsUploading(true)
      setError(null)

      try {
        const endpoint = side === 'question' ? '/question-audio' : '/answer-audio'
        await apiRequest(`/cards/${cardId}/levels/${levelIndex}${endpoint}/${index}`, {
          method: 'DELETE',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [cardId, levelIndex, side]
  )

  return {
    uploadAudio,
    deleteAudio,
    isUploading,
    error,
  }
}
