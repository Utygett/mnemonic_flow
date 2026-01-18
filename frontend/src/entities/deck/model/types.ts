// Deck domain types

export type PublicDeckSummary = {
  deck_id: string;
  title: string;
  description: string | null;
  color: string | null;
  owner_id: string;
  is_public: boolean;

  /** True if current user is allowed to edit this deck (owner or granted permission). */
  can_edit?: boolean;

  count_repeat: number;
  count_for_repeat: number;
  cards_count: number;
  completed_cards_count: number;
};

export interface Deck {
  id: string;
  name: string;
  description: string;
  cardsCount: number;
  progress: number; // 0-100
  averageLevel: number; // 0-3
  color: string;
}

// API-specific types
export type ApiDeckWithCards = {
  deck_id: string;
  title: string;
  description: string | null;
  color: string | null;
  owner_id: string;
  is_public: boolean;

  /** True if current user is allowed to edit this deck (owner or granted permission). */
  can_edit?: boolean;

  cards: ApiCard[];
};

export type ApiCard = {
  card_id: string;
  deck_id: string;
  title: string;
  card_type: string;
  levels: ApiLevel[];
  user_progress?: ApiUserProgress | null;
};

export type ApiLevel = {
  level_index: number;
  content: Record<string, unknown>;
};

export type ApiUserProgress = {
  active_level: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  last_review: string | null;
  next_review: string | null;
};
