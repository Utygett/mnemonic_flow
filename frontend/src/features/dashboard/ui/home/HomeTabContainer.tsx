import React from 'react';

import type { Deck, Group, StudyMode, Statistics } from '../../../../types';
import type { PersistedSession } from '@/shared/lib/utils/session-store';

import type { PublicDeckSummary } from '@/entities/deck';

import { CreateGroup } from '../../../../features/group-create';
import { DeckDetailsScreen } from '../../../../features/deck-details';
import { AddDeck } from '../../../../features/deck-add';

import { HomeTab } from './HomeTab';

type Props = {
  // данные home
  statistics: Statistics;
  decks: Deck[];
  groups: Group[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;

  // из твоего useGroupsDecksController
  refreshGroups: () => Promise<void>;
  refreshDecks: () => Promise<void>;
  currentGroupDeckIds: string[];
  onDeleteActiveGroup: () => void;

  // resume
  resumeCandidate: PersistedSession | null;
  onResume: () => void;
  onDiscardResume: () => void;

  // действия, которые запускают study (остаются в App)
  onStartReviewStudy: () => Promise<void>;
  onStartDeckStudy: (deckId: string, mode: StudyMode, limit?: number) => Promise<void>;
  onResumeDeckSession: (saved: PersistedSession) => void;
  onRestartDeckSession: (deckId: string) => void;

  // пока оставляем редактирование колоды глобальным
  onOpenEditDeck: (deckId: string) => void;
};

type HomeView =
  | { kind: 'dashboard' }
  | { kind: 'createGroup' }
  | { kind: 'addDeck' }
  | { kind: 'deckDetails'; deckId: string };

function mapDeckToPublicSummary(deck: Deck): PublicDeckSummary {
  // NOTE: это fallback-адаптер для старого типа Deck (из '../../../../types').
  // Правильный источник для dashboard — API summary /decks/ (PublicDeckSummary).
  return {
    deck_id: deck.id,
    title: deck.name,
    description: deck.description ?? null,
    color: deck.color ?? null,

    // Эти поля в старом типе Deck отсутствуют — подставляем безопасные значения,
    // чтобы DeckCard мог корректно рисоваться.
    owner_id: '',
    is_public: false,
    can_edit: false,

    cards_count: deck.cardsCount ?? 0,
    completed_cards_count: Math.round(((deck.progress ?? 0) / 100) * (deck.cardsCount ?? 0)),
    count_repeat: 0,
    count_for_repeat: 0,
  };
}

export function HomeTabContainer(props: Props) {
  const [view, setView] = React.useState<HomeView>({ kind: 'dashboard' });

  React.useEffect(() => {
    if (view.kind === 'addDeck' && !props.activeGroupId) {
      setView({ kind: 'dashboard' });
    }
  }, [view.kind, props.activeGroupId]);

  // --- экраны home ---
  if (view.kind === 'createGroup') {
    return (
      <CreateGroup
        onCancel={() => setView({ kind: 'dashboard' })}
        onSave={async (createdGroupId) => {
          await props.refreshGroups();
          if (createdGroupId) props.setActiveGroupId(createdGroupId);
          setView({ kind: 'dashboard' });
        }}
      />
    );
  }

  if (view.kind === 'addDeck') {
    if (!props.activeGroupId) return null;

    return (
      <AddDeck
        groupId={props.activeGroupId}
        initialGroupDeckIds={props.currentGroupDeckIds}
        onClose={() => setView({ kind: 'dashboard' })}
        onChanged={() => props.refreshDecks()}
      />
    );
  }

  if (view.kind === 'deckDetails') {
    const deckId = view.deckId;

    return (
      <DeckDetailsScreen
        deckId={deckId}
        onBack={() => setView({ kind: 'dashboard' })}
        onStart={(mode, limit) => props.onStartDeckStudy(deckId, mode, limit)}
        onResume={(saved) => {
          setView({ kind: 'dashboard' });
          props.onResumeDeckSession(saved);
        }}
        clearSavedSession={() => props.onRestartDeckSession(deckId)}
      />
    );
  }

  // --- обычный home (dashboard) ---
  // ВАЖНО: DashboardContainer ожидает PublicDeckSummary[] (deck_id, cards_count, count_repeat, ...),
  // но сюда historically прокидывался Deck[] (id, name, progress...).
  // Это и ломало отображение цифр (DeckCard читает поля *_count из summary).
  const decksForDashboard = (props.decks as unknown as PublicDeckSummary[]).map((d: any) => {
    // если это уже PublicDeckSummary из API — оставляем как есть
    if (typeof d?.deck_id === 'string') return d as PublicDeckSummary;
    // иначе адаптируем старый Deck
    return mapDeckToPublicSummary(d as Deck);
  });

  return (
    <HomeTab
      statistics={props.statistics}
      decks={decksForDashboard as unknown as Deck[]}
      groups={props.groups}
      activeGroupId={props.activeGroupId}
      resumeCandidate={props.resumeCandidate}
      onResume={props.onResume}
      onDiscardResume={props.onDiscardResume}
      onGroupChange={props.setActiveGroupId}
      onCreateGroup={() => setView({ kind: 'createGroup' })}
      onDeleteActiveGroup={props.onDeleteActiveGroup}
      onStartStudy={props.onStartReviewStudy}
      onDeckClick={(deckId) => setView({ kind: 'deckDetails', deckId })}
      onOpenEditDeck={props.onOpenEditDeck}
      onAddDeck={() => {
        if (!props.activeGroupId) return;
        setView({ kind: 'addDeck' });
      }}
    />
  );
}
