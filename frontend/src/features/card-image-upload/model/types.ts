export interface CardImageUploadProps {
  cardId: string
  side: 'question' | 'answer'
  currentImageUrl?: string
  onImageChange?: (imageUrl: string | undefined) => void
}

export interface UploadImageResult {
  imageUrl: string
  imageName: string
}
