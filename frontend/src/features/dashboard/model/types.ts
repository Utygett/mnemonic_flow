import type { Statistics } from '@/entities/statistics';
import type { Deck } from '@/entities/deck';
import type { Group } from '@/entities/group';

export type ResumeSessionProps = {
  title: string;
  subtitle: string;
  cardInfo: string;
  onResume: () => void;
  onDiscard: () => void;
};

export type DashboardModel = {
  statistics: Statistics;
  decks: Deck[];
  groups: Group[];
  activeGroupId: string | null;
  resumeSession?: ResumeSessionProps;
};

export type DashboardActions = {
  onGroupChange: (groupId: string) => void;
  onStartStudy: () => void;
  onDeckClick: (deckId: string) => void;
  onEditDeck?: (deckId: string) => void;

  onCreateGroup: () => void;
  onDeleteActiveGroup: () => void;

  onAddDeck: () => void;
};
