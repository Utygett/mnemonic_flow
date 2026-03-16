import React from 'react'
import type { Group } from '@/entities/group'
import styles from './MoveDeckSheet.module.css'

type Props = {
  groups: Group[]
  currentGroupId: string | null
  onMove: (targetGroupId: string) => void
  onClose: () => void
}

export function MoveDeckSheet({ groups, currentGroupId, onMove, onClose }: Props) {
  const available = groups.filter(g => g.id !== currentGroupId)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Переместить в группу</h3>

        {available.length === 0 ? (
          <p className={styles.empty}>Нет других групп для перемещения</p>
        ) : (
          <ul className={styles.list}>
            {available.map(group => (
              <li key={group.id}>
                <button type="button" className={styles.groupItem} onClick={() => onMove(group.id)}>
                  {group.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  )
}
