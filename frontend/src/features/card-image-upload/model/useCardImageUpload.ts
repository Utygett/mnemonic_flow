import { useCallback, useState } from 'react'
import { apiRequest } from '@/shared/api'

import type { UploadImageResult } from './types'

export function useCardImageUpload(
  cardId: string,
  levelIndex: number,
  side: 'question' | 'answer'
) {
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
        const result = await apiRequest<UploadImageResult>(
          `/cards/${cardId}/levels/${levelIndex}${endpoint}`,
          {
            method: 'POST',
            headers: {}, // Let browser set Content-Type with boundary
            body: formData,
          }
        )

        // The API returns CardLevelContent, extract the image URLs
        const cardLevel = result as unknown as {
          question_image_urls?: string[]
          answer_image_urls?: string[]
        }
        const imageUrls =
          side === 'question' ? cardLevel.question_image_urls : cardLevel.answer_image_urls

        return {
          imageUrls: imageUrls || [], // Return the full array of URLs
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
    [cardId, levelIndex, side, validateFile]
  )

  const deleteImage = useCallback(
    async (index: number) => {
      setIsUploading(true)
      setError(null)

      try {
        const endpoint = side === 'question' ? '/question-image' : '/answer-image'
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
    uploadImage,
    deleteImage,
    isUploading,
    error,
  }
}
