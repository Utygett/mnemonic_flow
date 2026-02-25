import { useCallback, useState } from 'react'
import { importAnkiPackage, type ImportAnkiResult } from '../api/importAnkiApi'

export interface UseImportAnkiReturn {
  importFile: (file: File) => Promise<ImportAnkiResult | undefined>
  importing: boolean
  error: string | null
  clearError: () => void
}

export function useImportAnki(): UseImportAnkiReturn {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const importFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apkg')) {
      setError('Please select a .apkg file')
      return undefined
    }

    setImporting(true)
    setError(null)

    try {
      const result = await importAnkiPackage(file)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setError(message)
      throw err
    } finally {
      setImporting(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { importFile, importing, error, clearError }
}
