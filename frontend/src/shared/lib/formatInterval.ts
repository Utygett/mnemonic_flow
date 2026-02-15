export function formatInterval(secondsRaw: number): string {
  const seconds = Math.max(0, Math.round(secondsRaw))

  if (seconds < 60) return `${seconds} сек`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} мин`

  const hours = Math.round(seconds / 3600)
  if (hours < 24) return `${hours} ч`

  const days = Math.round(seconds / 86400)
  return `${days} дн`
}
