export type DeckInviteMode = 'editor' | 'share'

export type DeckInviteProps = {
  deckId: string
  mode: DeckInviteMode
  onClose: () => void
}
