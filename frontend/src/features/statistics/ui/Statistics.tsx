import React from 'react'

import { Flame, Timer, Layers } from 'lucide-react'

import { getStatistics } from '@/entities/statistics'
import type { Statistics as StatisticsType } from '@/entities/statistics'

import styles from './Statistics.module.css'

type Props = {
  statistics: StatisticsType
  decks: any[]
}

export function Statistics({ statistics, decks }: Props) {
  const statCards = [
    {
      label: 'Сегодня изучено',
      value: `${statistics.cardsStudiedToday ?? 0}`,
      hint: 'Количество карточек, которые вы повторили сегодня',
      icon: <Layers size={18} />,
    },
    {
      label: 'Время сегодня',
      value: `${statistics.timeSpentToday ?? 0} мин`,
      hint: 'Суммарное время обучения за сегодня',
      icon: <Timer size={18} />,
    },
    {
      label: 'Текущая серия',
      value: `${statistics.currentStreak ?? 0} дн.`,
      hint: 'Сколько дней подряд вы учили карточки',
      icon: <Flame size={18} />,
    },
    {
      label: 'Всего карточек',
      value: `${statistics.totalCards ?? 0}`,
      hint: 'Общее количество ваших карточек',
      icon: <Layers size={18} />,
    },
  ]

  return (
    <div className="stats-page">
      <div className="page__header">
        <div className="page__header-inner statsHeader">
          <h1 className="page__title">Статистика</h1>
          <div className="statsHeader__sub">Ваша активность</div>
        </div>
      </div>

      <main className="container-centered max-w-390">
        <div className="statsCards">
          {statCards.map((card, idx) => (
            <div key={idx} className="statsCard" title={card.hint}>
              <div className="statsCard__icon">{card.icon}</div>
              <div className="statsCard__label">{card.label}</div>
              <div className="statsCard__value">{card.value}</div>
            </div>
          ))}
        </div>

        {statistics.weeklyActivity && statistics.weeklyActivity.length > 0 && (
          <div className="card mt-4">
            <div className="statsSection">
              <h3 className="statsSection__title">Активность за последние 7 дней</h3>
              <div className="statsActivity">
                {statistics.weeklyActivity.map((day, idx) => (
                  <div key={idx} className="statsActivity__bar">
                    <div className="statsActivity__label">{day.date}</div>
                    <div className="statsActivity__barTrack">
                      <div
                        className="statsActivity__barFill"
                        style={{ width: `${Math.min(day.reviews * 10, 100)}%` }}
                      />
                    </div>
                    <div className="statsActivity__value">{day.reviews}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {statistics.achievements && statistics.achievements.length > 0 && (
          <div className="card mt-4">
            <div className="statsSection">
              <h3 className="statsSection__title">Достижения</h3>
              <div className="statsAchievements">
                {statistics.achievements.map((achievement, idx) => (
                  <div key={idx} className="statsAchievement">
                    <div className="statsAchievement__icon">{achievement.icon}</div>
                    <div className="statsAchievement__title">{achievement.title}</div>
                    <div className="statsAchievement__description">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
