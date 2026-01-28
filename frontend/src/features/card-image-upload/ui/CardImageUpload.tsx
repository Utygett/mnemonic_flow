import { useRef, ChangeEvent, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback'

import type { CardImageUploadProps } from '../model/types'
import { useCardImageUpload } from '../model/useCardImageUpload'

import styles from './CardImageUpload.module.css'

export function CardImageUpload({
  cardId,
  side,
  currentImageUrl,
  onImageChange,
}: CardImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, deleteImage, isUploading, error } = useCardImageUpload(cardId, side)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayUrl = previewUrl || currentImageUrl

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      const result = await uploadImage(file)
      onImageChange?.(result.imageUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setPreviewUrl(null)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteImage()
      setPreviewUrl(null)
      onImageChange?.(undefined)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const sideLabel = side === 'question' ? 'Question' : 'Answer'

  return (
    <div className={styles.container}>
      <div className={styles.label}>{sideLabel} Image</div>

      {displayUrl ? (
        <div className={styles.imageWrapper}>
          <ImageWithFallback src={displayUrl} alt={`${sideLabel} image`} className={styles.image} />
          {!isUploading && (
            <button
              type="button"
              onClick={handleDelete}
              className={styles.deleteButton}
              title="Remove image"
            >
              <X size={16} />
            </button>
          )}
          {isUploading && (
            <div className={styles.overlay}>
              <Loader2 size={32} className={styles.spinner} />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={styles.uploadButton}
        >
          {isUploading ? <Loader2 size={24} className={styles.spinner} /> : <ImageIcon size={24} />}
          <span>{isUploading ? 'Uploading...' : `Add ${sideLabel} Image`}</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.hint}>Max 5MB. JPG, PNG, WebP</div>
    </div>
  )
}
