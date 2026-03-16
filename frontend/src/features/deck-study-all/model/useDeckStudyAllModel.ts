import { useUserDecks } from './useUserDecks'
import type { DeckStudyAllProps } from './types'

export type DeckStudyAllViewModel = ReturnType<typeof useDeckStudyAllModel>

export function useDeckStudyAllModel(props: DeckStudyAllProps) {
  const userDecks = useUserDecks()

  return {
    filteredDecks: userDecks.filteredDecks,
    loading: userDecks.loading,
    error: userDecks.error,
    searchQuery: userDecks.searchQuery,
    setSearchQuery: userDecks.setSearchQuery,
    onStudyStart: props.onStudyStart,
    onBack: props.onBack,
  }
}
