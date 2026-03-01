import { useQuery } from '@tanstack/react-query'
import { getDeckProgress } from '@/entities/statistics/api/statisticsApi'
import type { DeckProgressStats } from '@/entities/statistics/model/types'

export function useDeckProgress() {
  return useQuery<DeckProgressStats[]>({
    queryKey: ['stats', 'deck-progress'],
    queryFn: getDeckProgress,
  })
}
