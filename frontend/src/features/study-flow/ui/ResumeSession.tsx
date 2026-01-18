import React from 'react';

import styles from './ResumeSession.module.css';

interface ResumeSessionCardProps {
  title: string;
  subtitle: string;
  cardInfo: string;
  onResume: () => void;
  onDiscard: () => void;
}

export function ResumeSessionCard({
  title,
  subtitle,
  cardInfo,
  onResume,
  onDiscard,
}: ResumeSessionCardProps) {
  return (
    <div className={styles.resumeSession}>
      <div className={styles.card}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
        <p className={styles.info}>{cardInfo}</p>

        <div className={styles.buttons}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={onResume}
          >
            Продолжить
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onDiscard}
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}
