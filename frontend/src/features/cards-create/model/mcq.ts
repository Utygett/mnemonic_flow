import type { LevelMCQ } from './types'
import { newId } from './utils'

export function makeDefaultMcqLevel(): LevelMCQ {
  const a = newId()
  const b = newId()

  return {
    question: '',
    options: [
      { id: a, text: '' },
      { id: b, text: '' },
    ],
    correctOptionId: a,
    explanation: '',
    timerSec: undefined,
  }
}
