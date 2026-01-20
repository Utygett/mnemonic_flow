import React from 'react'

import { Button } from '../../../shared/ui/Button/Button'
import { ResumeSessionCard } from '@/features/study-flow'

import type { DashboardActions, DashboardModel } from '../model/types'

import { DashboardStats } from './components/DashboardStats'
import { GroupsBar } from './components/GroupsBar'
import { DeckList } from './components/DeckList'

import styles from './DashboardView.module.css'

export function DashboardView({
  model,
  actions,
}: {
  model: DashboardModel
  actions: DashboardActions
}) {
  const activeGroup = model.groups.find(g => g.id === model.activeGroupId)
  const groupDescription = activeGroup?.description?.trim()

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <DashboardStats statistics={model.statistics} />
        </div>
      </div>

      {model.resumeSession && <ResumeSessionCard {...model.resumeSession} />}

      <div className={styles.actionSection}>
        <Button onClick={actions.onStartStudy} variant="primary" size="large" fullWidth>
          Начать обучение
        </Button>
      </div>

      <GroupsBar
        groups={model.groups}
        activeGroupId={model.activeGroupId}
        onGroupChange={actions.onGroupChange}
        onCreateGroup={actions.onCreateGroup}
        onDeleteActiveGroup={actions.onDeleteActiveGroup}
      />

      {groupDescription && (
        <div className={styles.groupDescriptionSection}>
          <p className={styles.groupDescription}>{groupDescription}</p>
        </div>
      )}

      <DeckList
        decks={model.decks}
        onDeckClick={actions.onDeckClick}
        onEditDeck={actions.onEditDeck}
      />

      <div className={styles.footerSection}>
        <Button onClick={actions.onAddDeck} variant="primary" size="medium" fullWidth>
          Добавить колоду
        </Button>
      </div>
    </div>
  )
}
