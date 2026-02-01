import { useCallback, useState } from 'react'
import { apiRequest } from '@/shared/api'

import type { UploadImageResult } from './types'

export function useCardImageUpload(cardId: string, side: 'question' | 'answer') {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are allowed'
    }

    if (file.size > MAX_SIZE) {
      return 'File size must be less than 5MB'
    }

    return null
  }, [])

  const uploadImage = useCallback(
    async (file: File): Promise<UploadImageResult> => {
      const validationError = validateFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      setIsUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      try {
        const endpoint = side === 'question' ? '/question-image' : '/answer-image'
        const result = await apiRequest<UploadImageResult>(`/cards/${cardId}${endpoint}`, {
          method: 'POST',
          headers: {}, // Let browser set Content-Type with boundary
          body: formData,
        })

        // The API returns CardSummary, extract just the image URL
        const cardSummary = result as unknown as {
          question_image_url?: string
          answer_image_url?: string
        }
        const imageUrl =
          side === 'question' ? cardSummary.question_image_url : cardSummary.answer_image_url

        return {
          imageUrl: imageUrl || '',
          imageName: file.name,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [cardId, side, validateFile]
  )

  const deleteImage = useCallback(async () => {
    setIsUploading(true)
    setError(null)

    try {
      const endpoint = side === 'question' ? '/question-image' : '/answer-image'
      await apiRequest(`/cards/${cardId}${endpoint}`, {
        method: 'DELETE',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      setError(message)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [cardId, side])

  return {
    uploadImage,
    deleteImage,
    isUploading,
    error,
  }
}
