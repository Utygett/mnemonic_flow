import { useEffect, useState } from 'react';
import type { PublicDeckSummary } from '@/entities/deck';
import { LAST_DECK_KEY } from './utils';

export type CardType = 'flashcard' | 'multiple_choice';

export type CreateCardModel = {
  term: string;
  setTerm: (v: string) => void;

  cardType: CardType;
  setCardType: (v: CardType) => void;

  deckId: string;
  setDeckId: (v: string) => void;

  activeLevel: number;
  setActiveLevel: (v: number) => void;

  qPreview: boolean;
  setQPreview: (v: boolean) => void;

  aPreview: boolean;
  setAPreview: (v: boolean) => void;

  mcqQPreview: boolean;
  setMcqQPreview: (v: boolean) => void;

  mcqOptionsPreview: boolean;
  setMcqOptionsPreview: (v: boolean) => void;

  mcqExplanationPreview: boolean;
  setMcqExplanationPreview: (v: boolean) => void;
};

export function useCreateCardModel(decks: PublicDeckSummary[] | undefined): CreateCardModel {
  const [term, setTerm] = useState('');
  const [cardType, setCardType] = useState<CardType>('flashcard');

  const [deckId, setDeckId] = useState<string>(() => {
    const saved = localStorage.getItem(LAST_DECK_KEY);
    return saved ?? '';
  });

  const [activeLevel, setActiveLevel] = useState(0);

  const [qPreview, setQPreview] = useState(false);
  const [aPreview, setAPreview] = useState(false);

  const [mcqQPreview, setMcqQPreview] = useState(false);
  const [mcqOptionsPreview, setMcqOptionsPreview] = useState(false);
  const [mcqExplanationPreview, setMcqExplanationPreview] = useState(false);

  // Если deckId пустой или больше не существует — подставить первую доступную колоду.
  useEffect(() => {
    if (!decks || decks.length === 0) return;
    if (deckId && decks.some((d) => d.deck_id === deckId)) return;
    setDeckId(decks[0].deck_id);
  }, [decks, deckId]);

  // Persist выбранную колоду.
  useEffect(() => {
    if (!deckId) return;
    localStorage.setItem(LAST_DECK_KEY, deckId);
  }, [deckId]);

  // Reset UI при смене типа карточки.
  useEffect(() => {
    setActiveLevel(0);
    setQPreview(false);
    setAPreview(false);
    setMcqQPreview(false);
    setMcqOptionsPreview(false);
    setMcqExplanationPreview(false);
  }, [cardType]);

  return {
    term,
    setTerm,
    cardType,
    setCardType,
    deckId,
    setDeckId,
    activeLevel,
    setActiveLevel,
    qPreview,
    setQPreview,
    aPreview,
    setAPreview,
    mcqQPreview,
    setMcqQPreview,
    mcqOptionsPreview,
    setMcqOptionsPreview,
    mcqExplanationPreview,
    setMcqExplanationPreview,
  };
}
