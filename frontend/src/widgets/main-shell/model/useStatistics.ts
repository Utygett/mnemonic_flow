import { useCallback, useEffect, useState } from 'react'

import { getStatistics } from '@/entities/statistics'
import type { Statistics } from '@/entities/statistics'

type State = {
  statistics: Statistics | null
  loading: boolean
  error: unknown
}

export function useStatistics() {
  const [state, setState] = useState<State>({
    statistics: null,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const statistics = await getStatistics()
      setState({ statistics, loading: false, error: null })
    } catch (e) {
      setState({ statistics: null, loading: false, error: e })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    statistics: state.statistics,
    loading: state.loading,
    error: state.error,
    refresh,
  }
}
