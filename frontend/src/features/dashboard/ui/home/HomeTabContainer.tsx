import React from 'react'

import type { Group } from '@/entities/group'
import type { StudyMode } from '../../../../types'
import type { PersistedSession } from '@/shared/lib/utils/session-store'
import type { PublicDeckSummary } from '@/entities/deck'
import type { ImportAnkiResult } from '@/features/deck-import'

import { CreateGroup } from '../../../../features/group-create'
import { DeckDetailsScreen } from '../../../../features/deck-details'
import { AddDeck } from '../../../../features/deck-add'

import { StudyTabView } from '../StudyTabView'

type Props = {
  decks: PublicDeckSummary[]
  groups: Group[]
  activeGroupId: string | null
  setActiveGroupId: (id: string | null) => void

  refreshGroups: () => Promise<void>
  refreshDecks: () => Promise<void>
  currentGroupDeckIds: string[]
  onDeleteActiveGroup: () => void

  resumeCandidate: PersistedSession | null
  onResume: () => void
  onDiscardResume: () => void

  onStartDeckStudy: (deckId: string, mode: StudyMode, limit?: number) => Promise<void>
  onResumeDeckSession: (saved: PersistedSession) => void
  onRestartDeckSession: (deckId: string) => void

  onOpenEditDeck: (deckId: string) => void
  onDeleteDeck?: (deckId: string) => void
  onEditCard?: (cardId: string, deckId: string) => void
  onAddCard?: (deckId: string) => void
  onCreateDeck: () => void

  onSubScreenChange?: (isSubScreen: boolean) => void
}

type HomeView =
  | { kind: 'dashboard' }
  | { kind: 'createGroup' }
  | { kind: 'addDeck'; groupId: string }
  | { kind: 'deckDetails'; deckId: string }

function buildResumeSession(
  resume: PersistedSession,
  decks: PublicDeckSummary[],
  onResume: () => void,
  onDiscard: () => void
) {
  const subtitle =
    resume.mode === 'review'
      ? 'Учебная сессия'
      : (decks.find(d => d.deck_id === resume.activeDeckId)?.title ?? 'Колода')

  return {
    title: 'Продолжить сессию',
    subtitle,
    cardInfo: `Карточка ${resume.currentIndex + 1} из ${resume.deckCards.length}`,
    onResume,
    onDiscard,
  }
}

const RETURN_TO_DECK_KEY = 'mf_return_to_deck'
const RETURN_SCROLL_KEY = 'mf_return_scroll'

function restoreScroll() {
  const saved = sessionStorage.getItem(RETURN_SCROLL_KEY)
  if (!saved) return
  sessionStorage.removeItem(RETURN_SCROLL_KEY)

  const targetY = Number(saved)
  if (!targetY || targetY <= 0) return

  let attempts = 0
  const maxAttempts = 40 // 40 * 50ms = 2s max

  const tryScroll = () => {
    attempts++
    window.scrollTo(0, targetY)

    if (Math.abs(window.scrollY - targetY) < 5) return
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 50)
    }
  }

  setTimeout(tryScroll, 50)
}

export function HomeTabContainer(props: Props) {
  const [view, setViewRaw] = React.useState<HomeView>(() => {
    const returnDeckId = sessionStorage.getItem(RETURN_TO_DECK_KEY)
    if (returnDeckId) {
      sessionStorage.removeItem(RETURN_TO_DECK_KEY)
      return { kind: 'deckDetails', deckId: returnDeckId }
    }
    return { kind: 'dashboard' }
  })

  const setView = React.useCallback(
    (next: HomeView) => {
      setViewRaw(next)
      props.onSubScreenChange?.(next.kind !== 'dashboard')
    },
    [props.onSubScreenChange]
  )

  React.useEffect(() => {
    if (view.kind !== 'dashboard') {
      props.onSubScreenChange?.(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (view.kind === 'deckDetails' && sessionStorage.getItem(RETURN_SCROLL_KEY)) {
      restoreScroll()
    }
  }, [view.kind])

  if (view.kind === 'createGroup') {
    return (
      <CreateGroup
        onCancel={() => setView({ kind: 'dashboard' })}
        onSave={async createdGroupId => {
          await props.refreshGroups()
          if (createdGroupId) props.setActiveGroupId(createdGroupId)
          setView({ kind: 'dashboard' })
        }}
      />
    )
  }

  if (view.kind === 'addDeck') {
    return (
      <AddDeck
        groupId={view.groupId}
        initialGroupDeckIds={props.currentGroupDeckIds}
        onClose={() => setView({ kind: 'dashboard' })}
        onChanged={async () => {
          await props.refreshDecks()
        }}
      />
    )
  }

  if (view.kind === 'deckDetails') {
    const deckId = view.deckId

    const savePositionAndNavigate = (callback: () => void) => {
      sessionStorage.setItem(RETURN_TO_DECK_KEY, deckId)
      sessionStorage.setItem(RETURN_SCROLL_KEY, String(window.scrollY))
      callback()
    }

    return (
      <DeckDetailsScreen
        deckId={deckId}
        onBack={() => setView({ kind: 'dashboard' })}
        onStart={(mode, limit) => props.onStartDeckStudy(deckId, mode, limit)}
        onResume={saved => {
          setView({ kind: 'dashboard' })
          props.onResumeDeckSession(saved)
        }}
        clearSavedSession={() => props.onRestartDeckSession(deckId)}
        onEditCard={(cardId: string) => {
          savePositionAndNavigate(() => {
            if (props.onEditCard) props.onEditCard(cardId, deckId)
          })
        }}
        onAddCardWithDeckId={(deckId: string) => {
          savePositionAndNavigate(() => {
            if (props.onAddCard) props.onAddCard(deckId)
          })
        }}
      />
    )
  }

  // dashboard view
  const decksForStudy = props.decks

  const resumeSession = props.resumeCandidate
    ? buildResumeSession(
        props.resumeCandidate,
        decksForStudy,
        props.onResume,
        props.onDiscardResume
      )
    : undefined

  return (
    <StudyTabView
      decks={decksForStudy}
      groups={props.groups}
      activeGroupId={props.activeGroupId}
      resumeSession={resumeSession}
      onGroupChange={props.setActiveGroupId}
      onCreateGroup={() => setView({ kind: 'createGroup' })}
      onDeleteActiveGroup={props.onDeleteActiveGroup}
      onDeckClick={deckId => setView({ kind: 'deckDetails', deckId })}
      onEditDeck={props.onOpenEditDeck}
      onDeleteDeck={props.onDeleteDeck}
      onAddDeck={() => {
        if (!props.activeGroupId) return
        setView({ kind: 'addDeck', groupId: props.activeGroupId })
      }}
      onCreateDeck={props.onCreateDeck}
      onImportAnkiSuccess={async (result: ImportAnkiResult) => {
        await props.refreshDecks()
        setView({ kind: 'deckDetails', deckId: result.deck_id })
      }}
    />
  )
}
