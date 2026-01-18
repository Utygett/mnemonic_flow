// Transform domain card format to API request format
// Matches backend CreateCardRequest schema

export type CardData = {
  deckId: string;
  term: string;
  type: string;
  levels: Array<{ level_index?: number; content?: any } | any>;
};

function transformLevel(level: any) {
  // Extract content from nested { level_index, content } structure
  const content = level.content || level;
  return {
    question: content.question || '',
    answer: content.answer,
    options: content.options,
    correctOptionId: content.correctOptionId,
    explanation: content.explanation,
    timerSec: content.timerSec,
  };
}

export function toApiRequest(cardData: CardData) {
  return {
    deck_id: cardData.deckId,
    title: cardData.term,
    type: cardData.type,
    levels: cardData.levels.map(transformLevel),
  };
}
