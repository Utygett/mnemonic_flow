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
vi.mock('@/shared/ui/ImageWithFallback/ImageWithFallback', () => ({
  ImageWithFallback: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="image" />
  ),
}))

import { useCardImageUpload } from '../model/useCardImageUpload'

describe('CardImageUpload', () => {
  const mockOnImageChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock behavior
    vi.mocked(useCardImageUpload).mockReturnValue({
      uploadImage: mockUploadImage.mockResolvedValue({
        imageUrl: '/images/test.jpg',
        imageName: 'test.jpg',
      }),
      deleteImage: mockDeleteImage.mockResolvedValue(undefined),
      isUploading: false,
      error: null,
    })
  })

  describe('without existing image', () => {
    it('should render upload button when no image', () => {
      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      expect(screen.getByText('Add Question Image')).toBeInTheDocument()
    })

    it('should render answer side label correctly', () => {
      render(<CardImageUpload cardId="test-id" side="answer" onImageChange={mockOnImageChange} />)

      expect(screen.getByText('Answer Image')).toBeInTheDocument()
      expect(screen.getByText('Add Answer Image')).toBeInTheDocument()
    })

    it('should trigger file input when clicking upload button', () => {
      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      expect(input).toBeInTheDocument()
      expect(input.style.display).toBe('none')
    })

    it('should call uploadImage when file is selected', async () => {
      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockUploadImage).toHaveBeenCalledWith(file)
      })
    })

    it('should call onImageChange with URL after successful upload', async () => {
      mockUploadImage.mockResolvedValueOnce({
        imageUrl: '/images/uploaded.jpg',
        imageName: 'uploaded.jpg',
      })

      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnImageChange).toHaveBeenCalledWith('/images/uploaded.jpg')
      })
    })
  })

  describe('with existing image', () => {
    it('should render image when currentImageUrl is provided', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          side="question"
          currentImageUrl="/images/existing.jpg"
          onImageChange={mockOnImageChange}
        />
      )

      const img = screen.getByAltText('Question image')
      expect(img).toHaveAttribute('src', '/images/existing.jpg')
    })

    it('should render delete button when image exists', () => {
      render(
        <CardImageUpload
          cardId="test-id"
          side="question"
          currentImageUrl="/images/existing.jpg"
          onImageChange={mockOnImageChange}
        />
      )

      const deleteButton = screen.getByRole('button')
      expect(deleteButton).toBeInTheDocument()
    })

    it('should call deleteImage when delete button is clicked', async () => {
      render(
        <CardImageUpload
          cardId="test-id"
          side="question"
          currentImageUrl="/images/existing.jpg"
          onImageChange={mockOnImageChange}
        />
      )

      const deleteButton = screen.getByRole('button')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteImage).toHaveBeenCalled()
      })
    })

    it('should call onImageChange with undefined after deletion', async () => {
      render(
        <CardImageUpload
          cardId="test-id"
          side="question"
          currentImageUrl="/images/existing.jpg"
          onImageChange={mockOnImageChange}
        />
      )

      const deleteButton = screen.getByRole('button')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnImageChange).toHaveBeenCalledWith(undefined)
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

      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
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

      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
  })

  describe('hint text', () => {
    it('should display hint text', () => {
      render(<CardImageUpload cardId="test-id" side="question" onImageChange={mockOnImageChange} />)

      expect(screen.getByText('Max 5MB. JPG, PNG, WebP')).toBeInTheDocument()
    })
  })
})
