// src/shared/lib/hooks/useDecks.ts
import { useState, useEffect, useCallback } from 'react';
import type { PublicDeckSummary } from '@/entities/deck';
import { getGroupDecksSummary } from '@/entities/group';
import { ApiError } from '@/shared/api/request';

export type UseDecksResult = {
  decks: PublicDeckSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDecks(groupId: string | null): UseDecksResult {
  const [decks, setDecks] = useState<PublicDeckSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getGroupDecksSummary(groupId);
      setDecks(data);
    } catch (e: unknown) {
      if (e instanceof ApiError) setError(e.detail ?? e.message);
      else setError('Не удалось загрузить колоды');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) {
      setDecks([]);
      setError(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [groupId, refresh]);

  return { decks, loading, error, refresh };
}
