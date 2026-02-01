import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardAudioUpload } from './CardAudioUpload'

// Mock useCardAudioUpload
const mockUploadAudio = vi.fn()
const mockDeleteAudio = vi.fn()

vi.mock('../model/useCardAudioUpload', () => ({
  useCardAudioUpload: vi.fn(() => ({
    uploadAudio: mockUploadAudio,
    deleteAudio: mockDeleteAudio,
    isUploading: false,
    error: null,
  })),
}))

// Mock MediaRecorder and getUserMedia
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ondataavailable: null,
  onstop: null,
  state: 'inactive',
}

const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
}

Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: vi.fn(() => mockMediaRecorder),
})

// Mock isTypeSupported
MediaRecorder.isTypeSupported = vi.fn(() => true)

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(mockStream)),
  },
})

import { useCardAudioUpload } from '../model/useCardAudioUpload'

describe('CardAudioUpload', () => {
  const mockOnAudiosChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock behavior - returns array of URLs
    vi.mocked(useCardAudioUpload).mockReturnValue({
      uploadAudio: mockUploadAudio.mockResolvedValue({
        audioUrls: ['/audio/test.mp3'],
        audioName: 'test.mp3',
      }),
      deleteAudio: mockDeleteAudio.mockResolvedValue(undefined),
      isUploading: false,
      error: null,
    })
    // Reset MediaRecorder mock
    mockMediaRecorder.start.mockClear()
    mockMediaRecorder.stop.mockClear()
    mockMediaRecorder.state = 'inactive'
  })

  describe('without existing audio', () => {
    it('should render upload buttons when no audio', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      expect(screen.getByText('Upload File')).toBeInTheDocument()
      expect(screen.getByText('Record')).toBeInTheDocument()
    })

    it('should render answer side label correctly', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="answer"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      expect(screen.getByText('Answer Audio')).toBeInTheDocument()
    })

    it('should render question side label correctly', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      expect(screen.getByText('Question Audio')).toBeInTheDocument()
    })

    it('should trigger file input when clicking upload button', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      expect(input).toBeInTheDocument()
      expect(input.style.display).toBe('none')
      expect(input).toHaveAttribute('accept', 'audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg')
    })

    it('should call uploadAudio when file is selected', async () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockUploadAudio).toHaveBeenCalledWith(file)
      })
    })

    it('should call onAudiosChange with URLs array after successful upload', async () => {
      mockUploadAudio.mockResolvedValueOnce({
        audioUrls: ['/audio/uploaded.mp3'],
        audioName: 'uploaded.mp3',
      })

      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnAudiosChange).toHaveBeenCalledWith(['/audio/uploaded.mp3'])
      })
    })
  })

  describe('recording functionality', () => {
    it('should start recording when record button is clicked', async () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const recordButton = screen.getByText('Record')
      fireEvent.click(recordButton)

      await waitFor(() => {
        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
        expect(mockMediaRecorder.start).toHaveBeenCalled()
      })
    })

    it('should stop recording when stop button is clicked', async () => {
      mockMediaRecorder.state = 'recording'

      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      // First click to start recording
      const recordButton = screen.getByText('Record')
      fireEvent.click(recordButton)

      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled()
      })

      // Change state to recording
      mockMediaRecorder.state = 'recording'
      vi.mocked(useCardAudioUpload).mockReturnValue({
        uploadAudio: mockUploadAudio.mockResolvedValue({
          audioUrls: ['/audio/recording.webm'],
          audioName: 'recording.webm',
        }),
        deleteAudio: mockDeleteAudio.mockResolvedValue(undefined),
        isUploading: false,
        error: null,
      })

      // Rerender to update button state
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const stopButton = screen.getByText('Stop')
      fireEvent.click(stopButton)

      expect(mockMediaRecorder.stop).toHaveBeenCalled()
    })

    it('should disable upload button while recording', async () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const recordButton = screen.getByText('Record')
      fireEvent.click(recordButton)

      await waitFor(() => {
        expect(mockMediaRecorder.start).toHaveBeenCalled()
      })

      const uploadButton = screen.getByText('Upload File').closest('button')
      expect(uploadButton).toBeDisabled()
    })
  })

  describe('with existing audio', () => {
    it('should render audio players when currentAudioUrls is provided', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentAudioUrls={['/audio/existing.mp3', '/audio/existing2.mp3']}
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const audioPlayers = screen.getAllByTestId('audio-player') as HTMLAudioElement[]
      expect(audioPlayers).toHaveLength(2)
      expect(audioPlayers[0]).toHaveAttribute('src', '/audio/existing.mp3')
      expect(audioPlayers[1]).toHaveAttribute('src', '/audio/existing2.mp3')
    })

    it('should render delete buttons when audio exists', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentAudioUrls={['/audio/existing.mp3']}
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const deleteButtons = screen.getAllByTitle('Remove audio')
      expect(deleteButtons).toHaveLength(1)
      expect(deleteButtons[0]).toBeInTheDocument()
    })

    it('should call deleteAudio with index when delete button is clicked', async () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentAudioUrls={['/audio/existing.mp3']}
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const deleteButton = screen.getByTitle('Remove audio')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteAudio).toHaveBeenCalledWith(0)
      })
    })

    it('should call onAudiosChange with updated array after deletion', async () => {
      mockDeleteAudio.mockResolvedValue(undefined)

      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          currentAudioUrls={['/audio/existing.mp3']}
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const deleteButton = screen.getByTitle('Remove audio')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnAudiosChange).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('uploading state', () => {
    it('should show loading state when uploading', () => {
      vi.mocked(useCardAudioUpload).mockReturnValue({
        uploadAudio: mockUploadAudio,
        deleteAudio: mockDeleteAudio,
        isUploading: true,
        error: null,
      })

      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    it('should disable buttons while uploading', () => {
      vi.mocked(useCardAudioUpload).mockReturnValue({
        uploadAudio: mockUploadAudio,
        deleteAudio: mockDeleteAudio,
        isUploading: true,
        error: null,
      })

      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      const uploadButton = screen.getByText('Uploading...').closest('button')
      expect(uploadButton).toBeDisabled()
    })
  })

  describe('error state', () => {
    it('should display error message when upload fails', () => {
      vi.mocked(useCardAudioUpload).mockReturnValue({
        uploadAudio: mockUploadAudio,
        deleteAudio: mockDeleteAudio,
        isUploading: false,
        error: 'Upload failed',
      })

      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
  })

  describe('hint text', () => {
    it('should display hint text', () => {
      render(
        <CardAudioUpload
          cardId="test-id"
          levelIndex={0}
          side="question"
          onAudiosChange={mockOnAudiosChange}
        />
      )

      expect(
        screen.getByText('Max 10MB per file. MP3, M4A, WAV, WebM, OGG. Max 10 files.')
      ).toBeInTheDocument()
    })
  })
})
