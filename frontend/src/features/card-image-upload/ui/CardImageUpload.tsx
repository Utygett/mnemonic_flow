import { useRef, ChangeEvent, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react'
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback'

import type { CardImageUploadProps } from '../model/types'
import { useCardImageUpload } from '../model/useCardImageUpload'

import styles from './CardImageUpload.module.css'

export function CardImageUpload({
  cardId,
  levelIndex,
  side,
  currentImageUrls,
  onImagesChange,
}: CardImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, deleteImage, isUploading, error } = useCardImageUpload(
    cardId,
    levelIndex,
    side
  )
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const displayUrls = [...previewUrls, ...(currentImageUrls || [])]

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)

      const result = await uploadImage(file)
      // Notify parent of new URLs so it can update its state
      onImagesChange?.(result.imageUrls)
      // Clear the preview since we now have the actual URLs from props
      setTimeout(() => {
        setPreviewUrls([])
      }, 100)
    } catch (err) {
      console.error('Upload error:', err)
      setPreviewUrls([])
    }
  }

  const handleDelete = async (index: number) => {
    try {
      await deleteImage(index)
      // Update local state by removing the deleted image from the current URLs
      const newUrls = [...(currentImageUrls || [])]
      newUrls.splice(index, 1)
      onImagesChange?.(newUrls.length > 0 ? newUrls : undefined)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const sideLabel = side === 'question' ? 'Question' : 'Answer'

  return (
    <div className={styles.container}>
      <div className={styles.label}>{sideLabel} Images</div>

      {displayUrls.length > 0 && (
        <div className={styles.imagesList}>
          {displayUrls.map((url, index) => (
            <div key={index} className={styles.imageWrapper}>
              <ImageWithFallback
                src={url}
                alt={`${sideLabel} image ${index + 1}`}
                className={styles.image}
              />
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className={styles.deleteButton}
                  title={`Remove image ${index + 1}`}
                >
                  <X size={16} />
                </button>
              )}
              {isUploading && index === displayUrls.length - 1 && (
                <div className={styles.overlay}>
                  <Loader2 size={32} className={styles.spinner} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={styles.addButton}
      >
        <Plus size={20} />
        <span>Add Image</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.hint}>Max 5MB per image. JPG, PNG, WebP. Max 10 images.</div>
    </div>
  )
}
