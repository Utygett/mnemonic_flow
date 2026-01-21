// src/shared/lib/hooks/useApi.ts
import { useState, useCallback } from 'react'

/**
 * Generic hook for fetching data with loading and error states
 */
export function useApiData<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (fetchFn: () => Promise<T>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchData }
}
