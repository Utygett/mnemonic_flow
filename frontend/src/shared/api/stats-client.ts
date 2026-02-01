import { apiRequest } from './request'

import type { StatsOverview, StatsPeriod } from '../../features/statistics/model/statisticsTypes'

export async function getStatsOverview(period: StatsPeriod): Promise<StatsOverview> {
  return apiRequest<StatsOverview>(`/stats/overview?period=${encodeURIComponent(period)}`)
}
