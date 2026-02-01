export interface UploadAudioResult {
  audioUrls: string[] // All audio URLs after upload (the full array)
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
  currentAudioUrls?: string[]
  onAudiosChange?: (audioUrls: string[] | undefined) => void
}
