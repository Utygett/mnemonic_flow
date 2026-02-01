import React from 'react'

import type { CreateDeckProps } from '../model/types'
import { useCreateDeckModel } from '../model/useCreateDeckModel'
import { CreateDeckView } from './CreateDeckView'

export function CreateDeck(props: CreateDeckProps) {
  const vm = useCreateDeckModel(props)
  return <CreateDeckView {...vm} onCancel={props.onCancel} />
}
