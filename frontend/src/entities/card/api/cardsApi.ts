// Card API methods
import { apiRequest } from '@/shared/api/request';
import type {
  CardReviewInput,
  DifficultyRating,
  StudyCardsResponse,
  StudyMode,
  ApiLevelIn,
  ApiReplaceLevelsRequest,
  ApiCreateCardRequest,
  ApiCreateCardResponse,
} from '../model/types';

export async function getStudyCards(
  deckId: string,
  params: { mode: StudyMode; limit?: number; seed?: number }
): Promise<StudyCardsResponse> {
  const qs = new URLSearchParams();
  qs.set('mode', params.mode);
  qs.set('include', 'full');
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.seed != null) qs.set('seed', String(params.seed));

  return apiRequest<StudyCardsResponse>(`/decks/${deckId}/study-cards?${qs.toString()}`);
}

// Backwards-compatible helper (rating only)
export async function reviewCard(cardId: string, rating: DifficultyRating) {
  const now = new Date().toISOString();
  const payload: CardReviewInput = {
    rating,
    shownAt: now,
    ratedAt: now,
  };

  return apiRequest(`/cards/${cardId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// New API: review with timing
export async function reviewCardWithMeta(cardId: string, review: CardReviewInput) {
  return apiRequest(`/cards/${cardId}/review`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

export async function createCard(payload: ApiCreateCardRequest): Promise<ApiCreateCardResponse> {
  return apiRequest<ApiCreateCardResponse>(`/cards/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function replaceCardLevels(cardId: string, levels: ApiLevelIn[]): Promise<void> {
  return apiRequest<void>(`/cards/${cardId}/levels`, {
    method: 'PUT',
    body: JSON.stringify({ levels } satisfies ApiReplaceLevelsRequest),
  });
}

export async function levelUp(cardId: string) {
  return apiRequest(`/cards/${cardId}/level_up`, { method: 'POST' });
}

export async function levelDown(cardId: string) {
  return apiRequest(`/cards/${cardId}/level_down`, { method: 'POST' });
}

export async function getReviewSession(limit = 20) {
  return apiRequest(`/cards/review_with_levels?limit=${limit}`);
}

export async function deleteCardProgress(cardId: string) {
  return apiRequest<void>(`/cards/${cardId}/progress`, { method: 'DELETE' });
}

export async function deleteCard(cardId: string): Promise<void> {
  return apiRequest<void>(`/cards/${cardId}`, { method: 'DELETE' });
}
