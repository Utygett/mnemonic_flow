import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Group } from '../../../../types';

import { useGroupsCarousel } from '../../model/useGroupsCarousel';

import styles from './GroupsBar.module.css';

type Props = {
  groups: Group[];
  activeGroupId: string | null;
  onGroupChange: (id: string) => void;
  onCreateGroup: () => void;
  onDeleteActiveGroup: () => void;
};

export function GroupsBar({
  groups,
  activeGroupId,
  onGroupChange,
  onCreateGroup,
  onDeleteActiveGroup,
}: Props) {
  const { carouselRef, onWheelCarousel, onMouseDown, onMouseMove, onMouseUpOrLeave } = useGroupsCarousel();

  const safeGroups = groups ?? [];

  // Прокручиваем к активной группе при её изменении
  React.useEffect(() => {
    if (!activeGroupId || !carouselRef.current) return;

    const activeIndex = safeGroups.findIndex((g) => g.id === activeGroupId);
    if (activeIndex === -1) return;

    const activeButton = carouselRef.current.children[activeIndex] as HTMLElement;
    if (!activeButton) return;

    // Прокручиваем так, чтобы кнопка была в центре видимой области
    activeButton.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeGroupId, safeGroups]);

  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <button className={styles.buttonAdd} onClick={onCreateGroup} type="button">
          +
        </button>

        <div className={styles.carouselWrapper}>
          {safeGroups.length === 0 ? (
            <p className={styles.emptyMessage}>Создайте первую группу</p>
          ) : (
            <div
              ref={carouselRef}
              className={styles.carousel}
              onWheel={onWheelCarousel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUpOrLeave}
              onMouseLeave={onMouseUpOrLeave}
            >
              {safeGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={g.id === activeGroupId ? `${styles.pill} ${styles.pillActive}` : styles.pill}
                  onClick={() => onGroupChange(g.id)}
                >
                  {g.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={styles.buttonDelete}
          onClick={onDeleteActiveGroup}
          disabled={!activeGroupId}
          title={!activeGroupId ? 'Нет активной группы' : 'Удалить группу'}
          type="button"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
