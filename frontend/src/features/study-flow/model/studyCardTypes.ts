import type { CardContent } from '@/entities/card';

export type StudyMode = 'random' | 'ordered' | 'new_random' | 'new_ordered';

export interface CardLevel {
  levelindex: number;
  content: CardContent;
}

export interface StudyCard {
  id: string;
  deckId: string;
  title: string;
  type: string;
  levels: CardLevel[];
  activeLevel: number;
}

// helper’ы (удобно для StudySession/Create/Edit)
export function isMultipleChoice(card: StudyCard | null | undefined): boolean {
  return !!card && card.type === 'multiple_choice';
}
