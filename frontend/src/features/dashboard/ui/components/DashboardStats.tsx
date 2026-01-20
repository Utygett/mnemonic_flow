import React from 'react';
import { Clock, BookOpen, Flame } from 'lucide-react';
import type { Statistics } from '@/entities/statistics';

import styles from './DashboardStats.module.css';

type Props = {
  statistics: Statistics;
};

export function DashboardStats({ statistics }: Props) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.label}>
          <BookOpen size={16} className={styles.accent} />
          <span className={styles.meta}>Изучено</span>
        </div>
        <p className={styles.value}>{statistics.cardsStudiedToday}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>
          <Clock size={16} className={styles.accent2} />
          <span className={styles.meta}>Минут</span>
        </div>
        <p className={styles.value}>{statistics.timeSpentToday}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>
          <Flame size={16} className={styles.accent2} />
          <span className={styles.meta}>Дней</span>
        </div>
        <p className={styles.value}>{statistics.currentStreak}</p>
      </div>
    </div>
  );
}
