import { useMemo, useState } from 'react';

import { createDeck } from '@/entities/deck';

import type { CreateDeckProps } from './types';

export type CreateDeckViewModel = {
  title: string;
  setTitle: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  saving: boolean;
  error: string | null;

  canSubmit: boolean;
  submit: () => Promise<void>;
};

export function useCreateDeckModel(props: CreateDeckProps): CreateDeckViewModel {
  const { onSave } = props;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(title.trim()) && !saving, [title, saving]);

  const submit = async () => {
    const t = title.trim();
    const d = description.trim();
    if (!t) return;

    try {
      setSaving(true);
      setError(null);
      const created: any = await createDeck({ title: t, description: d ? d : null });
      onSave(String(created?.id ?? created?.deck_id ?? ''));
    } catch (e) {
      console.error(e);
      setError('Не удалось создать колоду');
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,

    description,
    setDescription,

    saving,
    error,
    canSubmit,
    submit,
  };
}
