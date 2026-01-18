import React from 'react';
import type { PublicDeckSummary } from '@/entities/deck';
import type { Group } from '@/entities/group';
import type { Statistics } from '@/entities/statistics';
import type { PersistedSession } from '@/shared/lib/utils/session-store';

import { DashboardView } from './DashboardView';
import type { DashboardActions, DashboardModel, ResumeSessionProps } from '../model/types';

type Props = {
  statistics: Statistics;
  decks: PublicDeckSummary[];
  groups: Group[];
  activeGroupId: string | null;

  resumeCandidate: PersistedSession | null;
  onResume: () => void;
  onDiscardResume: () => void;

  onGroupChange: (groupId: string) => void;
  onCreateGroup: () => void;
  onDeleteActiveGroup: () => void;

  onStartStudy: () => void;
  onDeckClick: (deckId: string) => void;
  onOpenEditDeck: (deckId: string) => void;

  onAddDeck: () => void; // тут уже нормальное имя
};

function buildResumeSession(
  resume: PersistedSession,
  decks: PublicDeckSummary[],
  onResume: () => void,
  onDiscard: () => void,
): ResumeSessionProps {
  const subtitle =
    resume.mode === 'review'
      ? 'Учебная сессия'
      : (decks.find((d) => d.deck_id === resume.activeDeckId)?.title ?? 'Колода');

  return {
    title: 'Продолжить сессию',
    subtitle,
    cardInfo: `Карточка ${resume.currentIndex + 1} из ${resume.deckCards.length}`,
    onResume,
    onDiscard,
  };
}

export function DashboardContainer(props: Props) {
  const resumeSession = props.resumeCandidate
    ? buildResumeSession(props.resumeCandidate, props.decks, props.onResume, props.onDiscardResume)
    : undefined;

  const model: DashboardModel = {
    statistics: props.statistics,
    decks: props.decks,
    groups: props.groups,
    activeGroupId: props.activeGroupId,
    resumeSession,
  };

  const actions: DashboardActions = {
    onGroupChange: props.onGroupChange,
    onStartStudy: props.onStartStudy,
    onDeckClick: props.onDeckClick,
    onEditDeck: props.onOpenEditDeck,
    onCreateGroup: props.onCreateGroup,
    onDeleteActiveGroup: props.onDeleteActiveGroup,
    onAddDeck: props.onAddDeck,
  };

  return <DashboardView model={model} actions={actions} />;
}
