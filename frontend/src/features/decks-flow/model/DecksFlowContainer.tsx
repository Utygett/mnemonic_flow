import React from 'react'

export type DecksFlowApi = {
  isCreatingDeck: boolean
  isEditingDeck: boolean
  editingDeckId: string | null
  openCreateDeck: () => void
  closeCreateDeck: () => void
  openEditDeck: (deckId: string) => void
  closeEditDeck: () => void
  clearEditingDeckId: () => void
}

export function DecksFlowContainer({
  children,
}: {
  children: (api: DecksFlowApi) => React.ReactNode
}) {
  const [isCreatingDeck, setIsCreatingDeck] = React.useState(false)
  const [isEditingDeck, setIsEditingDeck] = React.useState(false)
  const [editingDeckId, setEditingDeckId] = React.useState<string | null>(null)

  const api: DecksFlowApi = {
    isCreatingDeck,
    isEditingDeck,
    editingDeckId,

    openCreateDeck: () => setIsCreatingDeck(true),
    closeCreateDeck: () => setIsCreatingDeck(false),

    openEditDeck: (deckId: string) => {
      setEditingDeckId(deckId)
      setIsEditingDeck(true)
    },
    closeEditDeck: () => {
      setIsEditingDeck(false)
      setEditingDeckId(null)
    },

    clearEditingDeckId: () => setEditingDeckId(null),
  }

  return <>{children(api)}</>
}
