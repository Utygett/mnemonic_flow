/**
 * Режимы автовоспроизведения аудиофайлов в карточках
 */
export type AudioAutoplayMode = 'all' | 'first' | 'disabled'

/**
 * Интервал воспроизведения между аудиофайлами (в мс)
 */
export const AUDIO_PLAY_INTERVAL = 1000

/**
 * Ключ localStorage для хранения настроек автовоспроизведения
 */
export const AUDIO_AUTOPLAY_STORAGE_KEY = 'mnemonic_audio_autoplay_mode'

/**
 * Значение режима автовоспроизведения по умолчанию
 */
export const DEFAULT_AUDIO_AUTOPLAY_MODE: AudioAutoplayMode = 'first'

/**
 * Получить сохранённый режим автовоспроизведения из localStorage
 */
export function getStoredAudioAutoplayMode(): AudioAutoplayMode {
  if (typeof window === 'undefined') return DEFAULT_AUDIO_AUTOPLAY_MODE

  try {
    const stored = localStorage.getItem(AUDIO_AUTOPLAY_STORAGE_KEY)
    if (stored && isValidAudioAutoplayMode(stored)) {
      return stored as AudioAutoplayMode
    }
  } catch (error) {
    console.debug('Failed to read audio autoplay mode from localStorage:', error)
  }

  return DEFAULT_AUDIO_AUTOPLAY_MODE
}

/**
 * Сохранить режим автовоспроизведения в localStorage
 */
export function setStoredAudioAutoplayMode(mode: AudioAutoplayMode): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(AUDIO_AUTOPLAY_STORAGE_KEY, mode)
  } catch (error) {
    console.debug('Failed to write audio autoplay mode to localStorage:', error)
  }
}

/**
 * Проверить, что строка является валидным режимом автовоспроизведения
 */
function isValidAudioAutoplayMode(value: string): value is AudioAutoplayMode {
  return value === 'all' || value === 'first' || value === 'disabled'
}

/**
 * Получить человекочитаемое название режима
 */
export function getAudioAutoplayModeLabel(mode: AudioAutoplayMode): string {
  switch (mode) {
    case 'all':
      return 'Все файлы подряд'
    case 'first':
      return 'Только первый файл'
    case 'disabled':
      return 'Отключено'
    default:
      return 'Неизвестно'
  }
}
