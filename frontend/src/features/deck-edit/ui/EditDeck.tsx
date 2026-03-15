import React, { useState } from 'react'

import { DeckInviteModal } from '@/features/deck-invite'

import type { EditDeckProps } from '../model/types'
import { useEditDeckModel } from '../model/useEditDeckModel'
import { EditDeckView } from './EditDeckView'

export function EditDeck(props: EditDeckProps) {
  const vm = useEditDeckModel(props)
  const [showInvite, setShowInvite] = useState(false)

  return (
    <>
      <EditDeckView
        {...vm}
        onCancel={props.onCancel}
        onInvite={() => setShowInvite(true)}
      />
      {showInvite && (
        <DeckInviteModal
          deckId={props.deckId}
          onClose={() => setShowInvite(false)}
        />
      )}
    </>
  )
}
