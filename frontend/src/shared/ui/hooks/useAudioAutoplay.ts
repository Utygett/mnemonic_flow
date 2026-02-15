import { useCallback, useEffect, useRef } from 'react'
import type { AudioAutoplayMode } from '../../model/audioSettings'
import { AUDIO_PLAY_INTERVAL } from '../../model/audioSettings'

/**
 * Хук для автовоспроизведения списка аудиофайлов
 *
 * @param audioUrls - Массив URL аудиофайлов
 * @param mode - Режим автовоспроизведения
 * @param shouldPlay - Флаг, указывающий, что воспроизведение должно начаться
 * @param playDelay - Задержка перед началом воспроизведения (мс)
 *
 * @returns Объект с методами для управления воспроизведением
 */
export function useAudioAutoplay(
  audioUrls: string[],
  mode: AudioAutoplayMode,
  shouldPlay: boolean,
  playDelay: number = 0
) {
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const isAutoplayActiveRef = useRef<boolean>(false)

  // Регистрация refs для аудио элементов
  const registerAudioRef = useCallback((index: number, element: HTMLAudioElement | null) => {
    audioRefs.current[index] = element
  }, [])

  // Остановка всех запланированных воспроизведений
  const stopPlayback = useCallback(() => {
    isAutoplayActiveRef.current = false
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }, [])

  // Воспроизведение конкретного аудио элемента
  const playAudioAtIndex = useCallback(
    (index: number) => {
      const filesToPlay = mode === 'first' ? 1 : audioUrls.length

      if (index >= filesToPlay || index >= audioRefs.current.length) {
        return
      }

      const audio = audioRefs.current[index]
      if (!audio) return

      const startTimeout = setTimeout(() => {
        if (isAutoplayActiveRef.current) {
          audio.play().catch(err => {
            console.debug('Auto-play prevented:', err)
          })
        }
      }, playDelay)

      timeoutsRef.current.push(startTimeout)
    },
    [audioUrls.length, mode, playDelay]
  )

  // Обработчик окончания воспроизведения
  const handleEnded = useCallback(
    (index: number) => {
      if (!isAutoplayActiveRef.current) return

      const filesToPlay = mode === 'first' ? 1 : audioUrls.length
      if (index + 1 < filesToPlay) {
        const timeout = setTimeout(() => {
          playAudioAtIndex(index + 1)
        }, AUDIO_PLAY_INTERVAL)
        timeoutsRef.current.push(timeout)
      }
    },
    [audioUrls.length, mode, playAudioAtIndex]
  )

  // Основной эффект для автозапуска
  useEffect(() => {
    if (mode === 'disabled' || audioUrls.length === 0 || !shouldPlay) {
      stopPlayback()
      return
    }

    isAutoplayActiveRef.current = true
    playAudioAtIndex(0)

    return () => {
      stopPlayback()
    }
  }, [audioUrls, mode, shouldPlay, playDelay, playAudioAtIndex, stopPlayback])

  return {
    registerAudioRef,
    stopPlayback,
    handleEnded,
  }
}
