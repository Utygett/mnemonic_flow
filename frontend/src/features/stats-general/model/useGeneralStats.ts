import { useQuery } from '@tanstack/react-query'
import { getGeneralStatistics } from '@/entities/statistics/api/statisticsApi'
import type { GeneralStatistics } from '@/entities/statistics/model/types'

export function useGeneralStats() {
  return useQuery<GeneralStatistics>({
    queryKey: ['stats', 'general'],
    queryFn: getGeneralStatistics,
  })
}
