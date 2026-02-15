import React from 'react'

import type { CreateGroupProps } from '../model/types'
import { useCreateGroupModel } from '../model/useCreateGroupModel'
import { CreateGroupView } from './CreateGroupView'

export function CreateGroup(props: CreateGroupProps) {
  const vm = useCreateGroupModel(props)
  return <CreateGroupView {...vm} onCancel={props.onCancel} />
}
