import React from 'react';
import type { PublicDeckSummary } from '../model/deckTypes';
import { useAuth } from '@/app/providers/auth/AuthContext';

import styles from './DeckCard.module.css';

interface DeckCardProps {
  deck: PublicDeckSummary;
  onClick: () => void;
  onEdit?: () => void;
}

export function DeckCard({ deck, onClick }: DeckCardProps) {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.id === deck.owner_id;
  void isOwner;

  const description = deck.description?.trim();

  const totalCards = deck.cards_count;
  const completedCards = deck.completed_cards_count;
  const repetitionsCount = deck.count_repeat;
  const forRepetition = deck.count_for_repeat;
  const progress = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  return (
    <button onClick={onClick} className={styles.deckCard}>
      <h3 className={styles.title}>{deck.title}</h3>

      <div className={styles.descriptionBox}>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : (
          <p className={styles.description}>Описание отсутствует</p>
        )}
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>Прогресс: {progress}%</span>
        <span className={styles.stat}>Количество повторений: {repetitionsCount}</span>
        <span className={styles.stat}>Для повторения: {forRepetition}</span>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <span className={styles.progressText}>
            {completedCards} / {totalCards}
          </span>
        </div>
      </div>
    </button>
  );
}
