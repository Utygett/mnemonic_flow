// Card content domain types (moved from features/cards-flow)

export type CardType = 'flashcard' | 'multiple_choice';

export type FlashcardContent = {
  question: string;
  answer: string;
  // можно хранить, но пока не используем для flashcard
  timerSec?: number;
};

export type McqOption = { id: string; text: string };

export type MultipleChoiceContent = {
  question: string;
  options: McqOption[];
  correctOptionId: string;
  explanation?: string;
  timerSec?: number;
};

export type CardContent = FlashcardContent | MultipleChoiceContent;
