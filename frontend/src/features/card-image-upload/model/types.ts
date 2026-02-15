export interface CardImageUploadProps {
  cardId: string
  levelIndex: number
  side: 'question' | 'answer'
  currentImageUrls?: string[]
  onImagesChange?: (imageUrls: string[] | undefined) => void
}

export interface UploadImageResult {
  imageUrls: string[] // All image URLs after upload (the full array)
  imageName: string
}
