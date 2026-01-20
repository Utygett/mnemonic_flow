export const LAST_DECK_KEY = 'mnemonicFlow:lastDeckId'

export function newId(): string {
  return Math.random().toString(16).slice(2)
}

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}
