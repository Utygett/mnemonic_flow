import React from 'react';

import type { CardReviewInput, StudyCard } from '@/entities/card';
import { StudySession } from '../session/StudySession';

import styles from './StudyFlow.module.css';

type Props = {
  isStudying: boolean;
  loadingDeckCards: boolean;
  deckCards: StudyCard[];

  cards: StudyCard[];
  currentIndex: number;
  isCompleted: boolean;

  onRate: (review: CardReviewInput) => void;
  onLevelUp: () => void;
  onLevelDown: () => void;
  onSkip: () => void;
  onRemoveFromProgress: () => void;
  onClose: () => void;

  onBackToHome: () => void;
};

export function StudyFlowView(props: Props) {
  if (!props.isStudying) return null;

  if (props.loadingDeckCards) {
    return (
      <div className={styles.studyFlow}>
        <div className={styles.studyFlowCenter}>
          <div className={styles.studyFlowMuted}>Загрузка карточек…</div>
        </div>
      </div>
    );
  }

  if (props.deckCards.length === 0) {
    return (
      <div className={styles.studyFlow}>
        <div className={`${styles.studyFlowCenter} ${styles.studyFlowCenterPadded}`}>
          <div className={`${styles.studyFlowCard} ${styles.studyFlowCardNarrow}`}>
            <h2 className={styles.studyFlowTitle}>Нет карточек</h2>
            <p className={styles.studyFlowText}>В этой сессии нет карточек для изучения.</p>
            <button className={`btn-primary ${styles.studyFlowFullWidth}`} onClick={props.onBackToHome}>
              Вернуться
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (props.isCompleted) {
    return (
      <div className={styles.studyFlow}>
        <div className={`${styles.studyFlowCenter} ${styles.studyFlowCenterPadded}`}>
          <div className={`${styles.studyFlowCard} ${styles.studyFlowCardNarrow}`}>
            <div className={styles.studyFlowEmoji} aria-hidden="true">
              🎉
            </div>
            <h2 className={styles.studyFlowTitle}>Сессия завершена</h2>
            <p className={styles.studyFlowText}>Отличная работа! Ты прошёл все карточки.</p>
            <button className={`btn-primary ${styles.studyFlowFullWidth}`} onClick={props.onBackToHome}>
              Вернуться в меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (props.cards.length === 0) {
    return (
      <div className={styles.studyFlow}>
        <div className={styles.studyFlowCenter}>
          <div className={styles.studyFlowMuted}>Нет карточек для изучения</div>
        </div>
      </div>
    );
  }

  return (
    <StudySession
      cards={props.cards}
      currentIndex={props.currentIndex}
      onRate={props.onRate}
      onLevelUp={props.onLevelUp}
      onLevelDown={props.onLevelDown}
      onClose={props.onClose}
      onSkip={props.onSkip}
      onRemoveFromProgress={props.onRemoveFromProgress}
    />
  );
}
