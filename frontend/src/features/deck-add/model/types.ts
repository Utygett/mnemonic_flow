export type AddDeckProps = {
  groupId: string;
  initialGroupDeckIds?: string[];
  onClose: () => void;
  onChanged?: (deckId: string, action: 'added' | 'removed') => void;
};
