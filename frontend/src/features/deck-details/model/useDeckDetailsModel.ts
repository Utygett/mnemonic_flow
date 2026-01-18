import { useMemo, useState } from 'react';

import type { StudyMode } from '@/entities/card';
import { loadSession, type PersistedSession } from '@/shared/lib/utils/session-store';

import type { DeckDetailsProps } from './types';

export type DeckDetailsViewModel = {
  deckId: string;
  limit: number;
  setLimit: (v: number) => void;

  saved: PersistedSession | null;
  hasSaved: boolean;

  limitClamped: number;

  onBack: () => void;
  onResume: () => void;
  onStart: (mode: StudyMode) => void;
};

export function useDeckDetailsModel(props: DeckDetailsProps): DeckDetailsViewModel {
  const [limit, setLimit] = useState<number>(20);
  const [sessionVersion, setSessionVersion] = useState(0);

  const key = (`deck:${props.deckId}` as const);

  const saved = useMemo(() => loadSession(key), [key, sessionVersion]);
  const hasSaved = !!saved && (saved.deckCards?.length ?? 0) > 0;

  const limitClamped = useMemo(() => {
    const n = Number(limit);
    if (!Number.isFinite(n)) return 20;
    return Math.max(1, Math.min(200, Math.trunc(n)));
  }, [limit]);

  const onStart = (mode: StudyMode) => {
    if (hasSaved) {
      props.clearSavedSession();
      setSessionVersion((v) => v + 1);
    }

    if (mode === 'new_random' || mode === 'new_ordered') props.onStart(mode, limitClamped);
    else props.onStart(mode);
  };

  const onResume = () => {
    if (!saved) return;
    props.onResume(saved);
  };

  return {
    deckId: props.deckId,
    limit,
    setLimit,

    saved,
    hasSaved,

    limitClamped,

    onBack: props.onBack,
    onResume,
    onStart,
  };
}
