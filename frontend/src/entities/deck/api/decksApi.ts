// Deck API methods
import { apiRequest } from '@/shared/api/request';
import type { PublicDeckSummary, ApiDeckWithCards } from '../model/types';

export async function getUserDecks(): Promise<PublicDeckSummary[]> {
  return apiRequest<PublicDeckSummary[]>(`/decks/`);
}

export async function getDeckWithCards(deckId: string): Promise<ApiDeckWithCards> {
  return apiRequest<ApiDeckWithCards>(`/decks/${deckId}/with_cards`);
}

export async function createDeck(payload: {
  title: string;
  description?: string | null;
  color?: string | null;
}): Promise<PublicDeckSummary> {
  return apiRequest<PublicDeckSummary>(`/decks/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDeck(
  deckId: string,
  payload: {
    title?: string;
    description?: string | null;
    color?: string | null;
    is_public?: boolean;
  }
): Promise<PublicDeckSummary> {
  return apiRequest<PublicDeckSummary>(`/decks/${deckId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDeck(deckId: string): Promise<void> {
  return apiRequest<void>(`/decks/${deckId}`, { method: 'DELETE' });
}

export async function searchPublicDecks(params: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<PublicDeckSummary[]> {
  const usp = new URLSearchParams();
  const q = params.q?.trim();
  if (q) usp.set('q', q);

  usp.set('limit', String(params.limit ?? 20));
  usp.set('offset', String(params.offset ?? 0));

  return apiRequest<PublicDeckSummary[]>(`/decks/public?${usp.toString()}`);
}
