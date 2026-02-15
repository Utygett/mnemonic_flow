import React, { useEffect, useState } from 'react'

// Компонент для отображения обновлений PWA
export function PWAUpdatePrompt() {
  const [showReload, setShowReload] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowReload(true)
                setWaitingWorker(newWorker)
              }
            })
          }
        })
      })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }
  }, [])

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
    setShowReload(false)
    window.location.reload()
  }

  if (!showReload) return null

  return (
    <div className="update-prompt">
      <div className="update-prompt__inner">
        <div className="update-prompt__row">
          <div className="update-prompt__icon">🔄</div>
          <div>
            <p style={{ color: '#E8EAF0', fontWeight: 500 }}>Доступно обновление!</p>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Новая версия приложения загружена. Обновите для получения новых функций.
            </p>
          </div>
          <div className="update-prompt__actions">
            <button onClick={() => setShowReload(false)} className="btn-ghost">
              Позже
            </button>
            <button onClick={reloadPage} className="btn-primary">
              Обновить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
