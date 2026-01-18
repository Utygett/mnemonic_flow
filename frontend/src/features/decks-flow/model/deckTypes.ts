export type PublicDeckSummary = {
  deck_id: string;
  title: string;
  description: string | null;
  color: string | null;
  owner_id: string;
  is_public: boolean;
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
