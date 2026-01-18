import React from 'react';
import { BarChart3, BookOpen, Home, User } from 'lucide-react';

import styles from './BottomNav.module.css';

interface BottomNavProps {
  activeTab: 'home' | 'study' | 'stats' | 'profile';
  onTabChange: (tab: 'home' | 'study' | 'stats' | 'profile') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Главная' },
    { id: 'study' as const, icon: BookOpen, label: 'Обучение' },
    { id: 'stats' as const, icon: BarChart3, label: 'Статистика' },
    { id: 'profile' as const, icon: User, label: 'Профиль' },
  ];

  return (
    <nav className={styles.nav} aria-label="Нижняя навигация">
      <div className={styles.inner}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={activeTab === id ? `${styles.item} ${styles.itemActive}` : styles.item}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={2} />
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
