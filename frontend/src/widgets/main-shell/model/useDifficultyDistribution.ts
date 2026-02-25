import { useCallback, useEffect, useState } from 'react'

import { getDifficultyDistribution } from '@/entities/statistics'
import type { DifficultyDistribution } from '@/entities/statistics'

type State = {
  distribution: DifficultyDistribution | null
  loading: boolean
  error: unknown
}

export function useDifficultyDistribution() {
  const [state, setState] = useState<State>({
    distribution: null,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const distribution = await getDifficultyDistribution()
      setState({ distribution, loading: false, error: null })
    } catch (e) {
      setState({ distribution: null, loading: false, error: e })
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    distribution: state.distribution,
    loading: state.loading,
    error: state.error,
    refresh,
  }
}
