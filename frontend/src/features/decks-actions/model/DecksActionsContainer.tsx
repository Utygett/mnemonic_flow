import React from 'react';

export type DecksActionsApi = {
  onDeckCreated: () => void;
  onDeckSaved: () => void;
};

export function DecksActionsContainer({
  refreshDecks,
  closeCreateDeck,
  closeEditDeck,
  children,
}: {
  refreshDecks: () => void;
  closeCreateDeck: () => void;
  closeEditDeck: () => void;
  children: (api: DecksActionsApi) => React.ReactNode;
}) {
  const onDeckCreated = () => {
    refreshDecks();
    closeCreateDeck();
  };

  const onDeckSaved = () => {
    refreshDecks();
    closeEditDeck();
  };

  return <>{children({ onDeckCreated, onDeckSaved })}</>;
}
