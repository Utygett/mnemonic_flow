import React from 'react';

interface LevelIndicatorProps {
  currentLevel: 0 | 1 | 2 | 3;
  size?: 'small' | 'medium' | 'large';
}

export function LevelIndicator({ currentLevel, size = 'medium' }: LevelIndicatorProps) {
  const sizeClass = `level-indicator--${size}`;

  return (
    <div className={`level-indicator ${sizeClass}`} aria-hidden>
      {[0, 1, 2, 3].map((level) => (
        <div
          key={level}
          className={`level-indicator__dot ${level <= currentLevel ? 'level-indicator__dot--active' : ''}`}
        />
      ))}
    </div>
  );
}
