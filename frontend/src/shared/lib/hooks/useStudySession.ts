// src/shared/lib/hooks/useStudySession.ts
import { useState, useEffect, useMemo, useRef } from 'react';
import { StudyCard, DifficultyRating, reviewCard } from '@/entities/card';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function useStudySession(deckCards: StudyCard[] | null, initialIndex = 0) {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // всегда держим актуальный initialIndex в ref (на случай, если deckCards пришли раньше)
  const initialIndexRef = useRef(initialIndex);
  useEffect(() => {
    initialIndexRef.current = initialIndex;
  }, [initialIndex]);

  const queueSig = useMemo(() => {
    if (!deckCards || deckCards.length === 0) return '';
    return deckCards.map(c => c.id).join('|');
  }, [deckCards]);

  const prevQueueSigRef = useRef<string>('');

  useEffect(() => {
    const nextCards = deckCards ?? [];
    setCards(nextCards);

    const prevSig = prevQueueSigRef.current;
    prevQueueSigRef.current = queueSig;

    // первичная загрузка очереди
    if (prevSig === '' && queueSig !== '') {
      const idx = clamp(initialIndexRef.current, 0, Math.max(0, nextCards.length - 1));
      setCurrentIndex(idx);
      return;
    }
    // если очередь реально изменилась (другая колода/другая сессия)
    if (prevSig !== '' && prevSig !== queueSig) {
      const idx = clamp(initialIndexRef.current, 0, Math.max(0, nextCards.length - 1));
      setCurrentIndex(idx);
      return;
    }
  }, [deckCards, queueSig]);

  const currentCard = cards[currentIndex] || null;
  const isCompleted = cards.length > 0 && currentIndex >= cards.length;

  const rateCard = async (rating: DifficultyRating) => {
    const card = currentCard;
    if (!card) return;

    try {
      await reviewCard(card.id, rating);
    } catch (err) {
      console.error('Failed to send rating:', err);
    }

    setCurrentIndex(prev => prev + 1);
  };

  const resetSession = () => setCurrentIndex(0);

  const skipCard = () => {
    setCurrentIndex((i) => Math.min(i + 1, cards.length)); // clamp
  };

  return { cards, currentIndex, setCurrentIndex, currentCard, isCompleted, rateCard, skipCard, resetSession };
}
