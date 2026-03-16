import React from 'react'

import type { DeckStudyAllProps } from '../model/types'
import { useDeckStudyAllModel } from '../model/useDeckStudyAllModel'
import { DeckStudyAllView } from './DeckStudyAllView'

export function DeckStudyAllScreen(props: DeckStudyAllProps) {
  const vm = useDeckStudyAllModel(props)
  return <DeckStudyAllView {...vm} />
}
