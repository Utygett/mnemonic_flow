import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActivityChart } from '@/entities/statistics/api/statisticsApi'
import type { ActivityChartEntry, ChartPeriod } from '@/entities/statistics/model/types'

export function useActivityChart() {
  const [period, setPeriod] = useState<ChartPeriod>('day')
  const [days, setDays] = useState(30)

  const { data, isLoading } = useQuery<ActivityChartEntry[]>({
    queryKey: ['stats', 'activity-chart', period, days],
    queryFn: () => getActivityChart(period, days),
  })

  return {
    data: data || [],
    isLoading,
    period,
    setPeriod,
    days,
    setDays,
  }
}
