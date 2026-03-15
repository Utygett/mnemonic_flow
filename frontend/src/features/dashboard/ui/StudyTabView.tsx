import React from 'react'

import { Button } from '../../../shared/ui/Button/Button'
import { ResumeSessionCard } from '@/features/study-flow'
import { ImportAnkiModal } from '@/features/deck-import'
import { DeckInviteModal } from '@/features/deck-invite'

import type { PublicDeckSummary } from '@/entities/deck'
import type { Group } from '@/entities/group'
import type { ImportAnkiResult } from '@/features/deck-import'

import { GroupsBar } from './components/GroupsBar'
import { DeckList } from './components/DeckList'
import { AddDeckModal } from './components/AddDeckModal'
import { MoveDeckSheet } from './components/MoveDeckSheet'

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
  groups: Group[]
  activeGroupId: string | null
  resumeSession?: ResumeSessionProps
  onGroupChange: (groupId: string | null) => void
  onCreateGroup: () => void
  onDeleteActiveGroup: () => void
  onDeckClick: (deckId: string) => void
  onEditDeck: (deckId: string) => void
  onDeleteDeck: (deckId: string) => void
  onMoveDeck?: (deckId: string, targetGroupId: string) => Promise<void>
  onAddDeck: () => void
  onCreateDeck: () => void
  onImportAnkiSuccess: (result: ImportAnkiResult) => void
}

export function StudyTabView(props: Props) {
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [showImportAnki, setShowImportAnki] = React.useState(false)
  const [movingDeckId, setMovingDeckId] = React.useState<string | null>(null)
  const [invitingDeckId, setInvitingDeckId] = React.useState<string | null>(null)

  const activeGroup = props.groups.find(g => g.id === props.activeGroupId)
  const groupDescription = activeGroup?.description?.trim()

  const handleMoveDeck = async (targetGroupId: string) => {
    if (!movingDeckId || !props.onMoveDeck) return
    await props.onMoveDeck(movingDeckId, targetGroupId)
    setMovingDeckId(null)
  }

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

      <DeckList
        decks={props.decks}
        onDeckClick={props.onDeckClick}
        onEditDeck={props.onEditDeck}
        onDeleteDeck={props.onDeleteDeck}
        onMoveDeck={props.onMoveDeck ? deckId => setMovingDeckId(deckId) : undefined}
        onInviteDeck={deckId => setInvitingDeckId(deckId)}
      />

      <div className={styles.footerSection}>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="medium" fullWidth>
          Добавить колоду
        </Button>
      </div>

      {showAddModal && (
        <AddDeckModal
          onSearchPublic={props.onAddDeck}
          onCreateOwn={props.onCreateDeck}
          onImportAnki={() => {
            setShowAddModal(false)
            setShowImportAnki(true)
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <ImportAnkiModal
        open={showImportAnki}
        onClose={() => setShowImportAnki(false)}
        onImportSuccess={result => {
          setShowImportAnki(false)
          props.onImportAnkiSuccess(result)
        }}
      />

      {movingDeckId && (
        <MoveDeckSheet
          groups={props.groups}
          currentGroupId={props.activeGroupId}
          onMove={handleMoveDeck}
          onClose={() => setMovingDeckId(null)}
        />
      )}

      {invitingDeckId && (
        <DeckInviteModal
          deckId={invitingDeckId}
          onClose={() => setInvitingDeckId(null)}
        />
      )}
    </div>
  )
}
