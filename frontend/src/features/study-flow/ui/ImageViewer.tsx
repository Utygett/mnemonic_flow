import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import styles from './ImageViewer.module.css'

type Props = {
  src: string | null
  alt?: string
  onClose: () => void
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function ImageViewer({ src, alt = 'Image', onClose }: Props) {
  const isOpen = Boolean(src)

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const panRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })

  useEffect(() => {
    if (!isOpen) return
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [isOpen, src])

  useEffect(() => {
    if (!isOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !src) return null

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    e.stopPropagation()

    const zoomIn = e.deltaY < 0
    const factor = zoomIn ? 1.12 : 0.9
    const next = clamp(scale * factor, 0.5, 5)

    setScale(next)
  }

  const handlePointerDown: React.PointerEventHandler<HTMLImageElement> = e => {
    if (scale <= 1) return

    e.preventDefault()
    e.stopPropagation()

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    panRef.current.active = true
    panRef.current.startX = e.clientX
    panRef.current.startY = e.clientY
    panRef.current.startOffsetX = offset.x
    panRef.current.startOffsetY = offset.y
  }

  const handlePointerMove: React.PointerEventHandler<HTMLImageElement> = e => {
    if (!panRef.current.active) return

    const dx = e.clientX - panRef.current.startX
    const dy = e.clientY - panRef.current.startY

    setOffset({
      x: panRef.current.startOffsetX + dx,
      y: panRef.current.startOffsetY + dy,
    })
  }

  const endPan: React.PointerEventHandler<HTMLImageElement> = e => {
    if (!panRef.current.active) return
    panRef.current.active = false

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} onWheel={handleWheel}>
      <div className={styles.topBar} onClick={e => e.stopPropagation()}>
        <div className={styles.hint}>Колёсико — зум, Esc — закрыть</div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>
      </div>

      <div className={styles.stage} onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={styles.image}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        />
      </div>
    </div>
  )
}
