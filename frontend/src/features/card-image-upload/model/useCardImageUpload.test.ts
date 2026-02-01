import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCardImageUpload } from './useCardImageUpload'

// Mock apiRequest
vi.mock('@/shared/api', () => ({
  apiRequest: vi.fn(),
}))

describe('useCardImageUpload', () => {
  const cardId = 'test-card-id'
  const levelIndex = 0
  const side = 'question' as const

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateFile', () => {
    it('should reject invalid file type', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue({})

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, side))

      const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' })

      await expect(result.current.uploadImage(invalidFile)).rejects.toThrow(
        'Only JPG, PNG, and WebP images are allowed'
      )
    })

    it('should reject file > 5MB', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue({})

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, side))

      const largeData = new Array(6 * 1024 * 1024 + 1).fill('x').join('')
      const largeFile = new File([largeData], 'large.jpg', { type: 'image/jpeg' })

      await expect(result.current.uploadImage(largeFile)).rejects.toThrow(
        'File size must be less than 5MB'
      )
    })

    it('should accept valid file', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue({
        question_image_urls: ['/images/cards/test/test.jpg'],
        answer_image_urls: undefined,
      })

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, side))

      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await result.current.uploadImage(validFile)

      await waitFor(() => {
        expect(result.current.isUploading).toBe(false)
      })
    })
  })

  describe('uploadImage', () => {
    it('should call correct endpoint for question side', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue({
        question_image_urls: ['/images/test.jpg'],
        answer_image_urls: undefined,
      })

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, 'question'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await result.current.uploadImage(file)

      expect(apiRequest).toHaveBeenCalledWith(
        `/cards/${cardId}/levels/${levelIndex}/question-image`,
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should call correct endpoint for answer side', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue({
        question_image_urls: undefined,
        answer_image_urls: ['/images/test.jpg'],
      })

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, 'answer'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await result.current.uploadImage(file)

      expect(apiRequest).toHaveBeenCalledWith(
        `/cards/${cardId}/levels/${levelIndex}/answer-image`,
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should set uploading state during upload', async () => {
      const { apiRequest } = await import('@/shared/api')
      let resolveUpload: (value: any) => void
      const uploadPromise = new Promise(resolve => {
        resolveUpload = resolve
      })
      vi.mocked(apiRequest).mockReturnValue(uploadPromise as any)

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, side))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadPromiseResult = result.current.uploadImage(file)

      await waitFor(() => {
        expect(result.current.isUploading).toBe(true)
      })

      resolveUpload!({ question_image_urls: ['/images/test.jpg'] })
      await uploadPromiseResult

      await waitFor(() => {
        expect(result.current.isUploading).toBe(false)
      })
    })

    it('should return image URLs array on success', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue({
        question_image_urls: ['/images/cards/abc123/test.jpg'],
        answer_image_urls: undefined,
      })

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, 'question'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadResult = await result.current.uploadImage(file)

      expect(uploadResult.imageUrls).toEqual(['/images/cards/abc123/test.jpg'])
      expect(uploadResult.imageName).toBe('test.jpg')
    })

    it('should set error on failure', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockRejectedValue(new Error('Upload failed'))

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, side))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await expect(result.current.uploadImage(file)).rejects.toThrow('Upload failed')

      await waitFor(() => {
        expect(result.current.error).toBe('Upload failed')
      })
    })
  })

  describe('deleteImage', () => {
    it('should call correct delete endpoint for question with index', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, 'question'))

      await result.current.deleteImage(0)

      expect(apiRequest).toHaveBeenCalledWith(
        `/cards/${cardId}/levels/${levelIndex}/question-image/0`,
        {
          method: 'DELETE',
        }
      )
    })

    it('should call correct delete endpoint for answer with index', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockResolvedValue(undefined)

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, 'answer'))

      await result.current.deleteImage(1)

      expect(apiRequest).toHaveBeenCalledWith(
        `/cards/${cardId}/levels/${levelIndex}/answer-image/1`,
        {
          method: 'DELETE',
        }
      )
    })

    it('should set error on delete failure', async () => {
      const { apiRequest } = await import('@/shared/api')
      vi.mocked(apiRequest).mockRejectedValue(new Error('Delete failed'))

      const { result } = renderHook(() => useCardImageUpload(cardId, levelIndex, side))

      await expect(result.current.deleteImage(0)).rejects.toThrow('Delete failed')

      await waitFor(() => {
        expect(result.current.error).toBe('Delete failed')
      })
    })
  })
})
