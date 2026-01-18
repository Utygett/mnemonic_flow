import { useEffect, useMemo, useState } from 'react';

import { getDeckWithCards, updateDeck } from '@/entities/deck';
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage';

import type { EditDeckProps } from './types';

export type EditDeckViewModel = {
  title: string;
  setTitle: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  isPublic: boolean;
  setIsPublic: (v: boolean) => void;

  loading: boolean;
  saving: boolean;
  error: string | null;

  canSubmit: boolean;
  submit: () => Promise<void>;
};

export function useEditDeckModel(props: EditDeckProps): EditDeckViewModel {
  const { deckId, onSaved } = props;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cardsWithDeck = await getDeckWithCards(deckId);
        const deck: any = (cardsWithDeck as any).deck;
        setTitle(deck?.title ?? deck?.name ?? '');
        setDescription(deck?.description ?? '');
        setIsPublic(Boolean(deck?.is_public ?? false));
      } catch (e: unknown) {
        console.error(e);
        setError('Не удалось загрузить колоду: ' + getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId]);

  const canSubmit = useMemo(() => Boolean(title.trim()) && !saving, [title, saving]);

  const submit = async () => {
    const t = title.trim();
    if (!t) return;

    try {
      setSaving(true);
      setError(null);

      await updateDeck(deckId, {
        title: t,
        description: description || null,
        is_public: isPublic,
      } as any);

      onSaved();
    } catch (e) {
      console.error(e);
      setError('Не удалось обновить колоду');
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,

    description,
    setDescription,

    isPublic,
    setIsPublic,

    loading,
    saving,
    error,

    canSubmit,
    submit,
  };
}
