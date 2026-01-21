import type { StudyCard } from '@/entities/card'

export function toStudyCards(items: any[]): StudyCard[] {
  return items as unknown as StudyCard[]
}
