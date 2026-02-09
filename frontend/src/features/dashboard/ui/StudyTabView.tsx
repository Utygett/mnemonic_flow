import React from 'react'

import { Button } from '../../../shared/ui/Button/Button'
import { ResumeSessionCard } from '@/features/study-flow'

import type { PublicDeckSummary } from '@/entities/deck'

import { GroupsBar } from './components/GroupsBar'
import { DeckList } from './components/DeckList'
import { AddDeckModal } from './components/AddDeckModal'

import styles from './DashboardView.module.css'

type ResumeSessionProps = {
  title: string
  subtitle: string
  cardInfo: string
  onResume: () => void
  onDiscard: () => void
}

type Props = {
  decks: PublicDeckSummary[]
  groups: any[]
  activeGroupId: string | null
  resumeSession?: ResumeSessionProps
  onGroupChange: (groupId: string | null) => void
  onCreateGroup: () => void
  onDeleteActiveGroup: () => void
  onDeckClick: (deckId: string) => void
  onEditDeck: (deckId: string) => void
  onAddDeck: () => void
  onCreateDeck: () => void
}

export function StudyTabView(props: Props) {
  const [showAddModal, setShowAddModal] = React.useState(false)

  const activeGroup = props.groups.find((g: any) => g.id === props.activeGroupId)
  const groupDescription = (activeGroup as any)?.description?.trim()

  return (
    <div className={styles.dashboard}>
      {props.resumeSession && <ResumeSessionCard {...props.resumeSession} />}

      <GroupsBar
        groups={props.groups}
        activeGroupId={props.activeGroupId}
        onGroupChange={props.onGroupChange}
        onCreateGroup={props.onCreateGroup}
        onDeleteActiveGroup={props.onDeleteActiveGroup}
      />

      {groupDescription && (
        <div className={styles.groupDescriptionSection}>
          <p className={styles.groupDescription}>{groupDescription}</p>
        </div>
      )}

      <DeckList decks={props.decks} onDeckClick={props.onDeckClick} onEditDeck={props.onEditDeck} />

      <div className={styles.footerSection}>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="medium" fullWidth>
          Добавить колоду
        </Button>
      </div>

      {showAddModal && (
        <AddDeckModal
          onSearchPublic={props.onAddDeck}
          onCreateOwn={props.onCreateDeck}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
