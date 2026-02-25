import React from 'react'

export type CardsFlowApi = {
  isCreatingCard: boolean
  isEditingCard: boolean
  editingCardId: string | null
  editingDeckId: string | null
  initialDeckId: string | null
  openCreateCard: (deckId?: string) => void
  closeCreateCard: () => void
  openEditCard: (cardId?: string, deckId?: string) => void
  closeEditCard: () => void
}

export function CardsFlowContainer({
  children,
}: {
  children: (api: CardsFlowApi) => React.ReactNode
}) {
  const [isCreatingCard, setIsCreatingCard] = React.useState(false)
  const [isEditingCard, setIsEditingCard] = React.useState(false)
  const [editingCardId, setEditingCardId] = React.useState<string | null>(null)
  const [editingDeckId, setEditingDeckId] = React.useState<string | null>(null)
  const [initialDeckId, setInitialDeckId] = React.useState<string | null>(null)

  const api: CardsFlowApi = {
    isCreatingCard,
    isEditingCard,
    editingCardId,
    editingDeckId,
    initialDeckId,
    openCreateCard: (deckId?: string) => {
      if (deckId) setInitialDeckId(deckId)
      setIsCreatingCard(true)
    },
    closeCreateCard: () => {
      setIsCreatingCard(false)
      setInitialDeckId(null)
    },
    openEditCard: (cardId?: string, deckId?: string) => {
      setEditingCardId(cardId ?? null)
      setEditingDeckId(deckId ?? null)
      setIsEditingCard(true)
    },
    closeEditCard: () => {
      setIsEditingCard(false)
      setEditingCardId(null)
      setEditingDeckId(null)
    },
  }

  return <>{children(api)}</>
}
