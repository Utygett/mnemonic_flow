import React from 'react'

import type { DeckDetailsProps } from '../model/types'
import { useDeckDetailsModel } from '../model/useDeckDetailsModel'
import { DeckDetailsView } from './DeckDetailsView'

export function DeckDetailsScreen(props: DeckDetailsProps) {
  const vm = useDeckDetailsModel(props)
  return <DeckDetailsView {...vm} />
}
