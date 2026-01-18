// src/features/cards-edit/ui/EditCard.tsx
import React from 'react';
import type { Props } from '../model/types';
import { useEditCardModel } from '../model/useEditCardModel';
import { EditCardView } from './EditCardView';

export function EditCard(props: Props) {
  const vm = useEditCardModel(props);
  return <EditCardView {...vm} onCancel={props.onCancel} />;
}
