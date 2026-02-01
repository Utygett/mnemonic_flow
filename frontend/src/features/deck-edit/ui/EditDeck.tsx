import React from 'react'

import type { EditDeckProps } from '../model/types'
import { useEditDeckModel } from '../model/useEditDeckModel'
import { EditDeckView } from './EditDeckView'

export function EditDeck(props: EditDeckProps) {
  const vm = useEditDeckModel(props)
  return <EditDeckView {...vm} onCancel={props.onCancel} />
}
