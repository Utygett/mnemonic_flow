export interface UploadAudioResult {
  audioUrl: string
  audioName: string
}

export interface AudioUploadOptions {
  cardId: string
  levelIndex: number
  side: 'question' | 'answer'
}

export interface CardAudioUploadProps {
  cardId: string
  levelIndex: number
  side: 'question' | 'answer'
  currentAudioUrl?: string
  onAudioChange?: (audioUrl: string | undefined) => void
}
