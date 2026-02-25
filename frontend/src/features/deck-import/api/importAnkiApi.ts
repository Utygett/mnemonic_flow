import { apiRequest } from '@/shared/api/request'

export interface ImportAnkiResult {
  deck_id: string
  title: string
  cards_created: number
  warnings: string[]
}

export async function importAnkiPackage(file: File): Promise<ImportAnkiResult> {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequest<ImportAnkiResult>('/decks/import-anki', {
    method: 'POST',
    body: formData,
  })
}
