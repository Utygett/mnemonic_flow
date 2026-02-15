import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardImageUpload } from './CardImageUpload'

// Mock useCardImageUpload
const mockUploadImage = vi.fn()
const mockDeleteImage = vi.fn()

vi.mock('../model/useCardImageUpload', () => ({
  useCardImageUpload: vi.fn(() => ({
    uploadImage: mockUploadImage,
    deleteImage: mockDeleteImage,
    isUploading: false,
    error: null,
  })),
}))

// Mock ImageWithFallback
vi.mock('@/shared/ui/ImageWithFallback', () => ({
  ImageWithFallback: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="image" />
  ),
}))

import { useCardImageUpload } from '../model/useCardImageUpload'

describe('CardImageUpload', () => {
  const mockOnImagesChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock behavior - returns array of URLs
    vi.mocked(useCardImageUpload).mockReturnValue({
      uploadImage: mockUploadImage.mockResolvedValue({
        imageUrls: ['/images/test.jpg'],
        imageName: 'test.jpg',
      }),
      deleteImage: mockDeleteImage.mockResolvedValue(undefined),
      isUploading: false,
      error: null,
    })
  })

  describe('without existing image', () => {
    it('should render upload button when no image', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      expect(screen.getByText('Add Image')).toBeInTheDocument()
    })

    it('should render answer side label correctly', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="answer"
          onImagesChange={mockOnImagesChange}
        />
      )

      expect(screen.getByText('Answer Images')).toBeInTheDocument()
    })

    it('should trigger file input when clicking upload button', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      expect(input).toBeInTheDocument()
      expect(input.style.display).toBe('none')
    })

    it('should call uploadImage when file is selected', async () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockUploadImage).toHaveBeenCalledWith(file)
      })
    })

    it('should call onImagesChange with URLs array after successful upload', async () => {
      mockUploadImage.mockResolvedValueOnce({
        imageUrls: ['/images/uploaded.jpg'],
        imageName: 'uploaded.jpg',
      })

      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(['/images/uploaded.jpg'])
      })
    })
  })

  describe('with existing images', () => {
    it('should render images when currentImageUrls is provided', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentImageUrls={['/images/existing.jpg', '/images/existing2.jpg']}
          onImagesChange={mockOnImagesChange}
        />
      )

      const images = screen.getAllByTestId('image') as HTMLImageElement[]
      expect(images).toHaveLength(2)
      expect(images[0]).toHaveAttribute('src', '/images/existing.jpg')
      expect(images[1]).toHaveAttribute('src', '/images/existing2.jpg')
    })

    it('should render delete buttons when images exist', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentImageUrls={['/images/existing.jpg']}
          onImagesChange={mockOnImagesChange}
        />
      )

      const deleteButtons = screen.getAllByTitle(/Remove image/i)
      expect(deleteButtons).toHaveLength(1)
      expect(deleteButtons[0]).toBeInTheDocument()
    })

    it('should call deleteImage with index when delete button is clicked', async () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentImageUrls={['/images/existing.jpg']}
          onImagesChange={mockOnImagesChange}
        />
      )

      const deleteButton = screen.getByTitle(/Remove image/i)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteImage).toHaveBeenCalledWith(0)
      })
    })

    it('should call onImagesChange with updated array after deletion', async () => {
      mockDeleteImage.mockResolvedValue(undefined)

      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentImageUrls={['/images/existing.jpg']}
          onImagesChange={mockOnImagesChange}
        />
      )

      const deleteButton = screen.getByTitle(/Remove image/i)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('uploading state', () => {
    it('should show loading state when uploading', () => {
      vi.mocked(useCardImageUpload).mockReturnValue({
        uploadImage: mockUploadImage,
        deleteImage: mockDeleteImage,
        isUploading: true,
        error: null,
      })

      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      const addButton = screen.getByText('Add Image').closest('button')
      expect(addButton).toBeDisabled()
    })
  })

  describe('error state', () => {
    it('should display error message when upload fails', () => {
      vi.mocked(useCardImageUpload).mockReturnValue({
        uploadImage: mockUploadImage,
        deleteImage: mockDeleteImage,
        isUploading: false,
        error: 'Upload failed',
      })

      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
  })

  describe('hint text', () => {
    it('should display hint text', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onImagesChange={mockOnImagesChange}
        />
      )

      expect(
        screen.getByText('Max 5MB per image. JPG, PNG, WebP. Max 10 images.')
      ).toBeInTheDocument()
    })
  })
})
