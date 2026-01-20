// src/features/cards-edit/ui/EditCardView.tsx
import React from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react'

import { Button } from '../../../shared/ui/Button/Button'
import { MarkdownField } from '../../../shared/ui/MarkdownField'

import type { EditCardViewModel } from '../model/useEditCardModel'

import styles from './EditCardView.module.css'

type Props = EditCardViewModel & {
  onCancel: () => void
}

export function EditCardView(props: Props) {
  const {
    decks,
    deckId,
    setDeckId,

    loading,
    saving,
    errorText,

    cards,
    selectedCardId,
    setSelectedCardId,
    selectedCard,

    titleDraft,
    setTitleDraft,

    activeLevel,
    setActiveLevel,
    levels,

    qPreview,
    setQPreview,
    aPreview,
    setAPreview,

    cleanedCount,
    canSave,

    addLevel,
    removeLevel,
    moveLevel,

    addOption,
    removeOption,
    patchOptionText,
    moveOption,

    patchLevel,

    saveCard,
    deleteSelectedCard,
    deleteCurrentDeck,

    isOwnerOfCurrentDeck,
    onEditDeck,

    onCancel,
  } = props

  const active = levels[activeLevel]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerRow}>
            <button onClick={onCancel} className={styles.iconButton}>
              <X size={24} />
            </button>
            <h2 className={styles.headerTitle}>Редактирование уровней</h2>
            <div className={styles.headerSpacer} />
          </div>
        </div>
      </div>

      <main className={styles.main}>
        {errorText && (
          <div className={styles.errorCard}>
            <div className={styles.errorText}>{errorText}</div>
          </div>
        )}

        {/* Deck */}
        <div className={styles.formRow}>
          <label className={styles.formLabel}>Колода</label>

          <div className={styles.rowWithActions}>
            <select
              value={deckId}
              onChange={e => setDeckId(e.target.value)}
              className={styles.input}
              disabled={decks.length === 0 || saving}
            >
              {decks.length === 0 ? (
                <option value="">Нет доступных колод</option>
              ) : (
                decks.map(d => (
                  <option key={d.deck_id} value={d.deck_id}>
                    {d.title}
                  </option>
                ))
              )}
            </select>

            <button
              onClick={deleteCurrentDeck}
              disabled={!deckId || decks.length === 0 || saving}
              title="Удалить колоду"
              className={`${styles.squareButton} ${styles.squareButtonDanger}`}
            >
              <Trash2 size={18} />
            </button>

            {isOwnerOfCurrentDeck && onEditDeck && deckId ? (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onEditDeck(deckId)
                }}
                title="Редактировать колоду"
                className={`${styles.squareButton} ${styles.squareButtonNeutral}`}
              >
                <Pencil size={18} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Card */}
        <div className={styles.formRow}>
          <label className={styles.formLabel}>Карточка</label>

          <div className={styles.rowWithActions}>
            <select
              value={selectedCardId}
              onChange={e => setSelectedCardId(e.target.value)}
              className={styles.input}
              disabled={loading || cards.length === 0 || saving}
            >
              <option value="">{loading ? 'Загрузка…' : 'Выбери карточку'}</option>
              {cards.map(c => (
                <option key={c.card_id} value={c.card_id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button
              onClick={deleteSelectedCard}
              disabled={!selectedCard || saving}
              title="Удалить карточку"
              className={`${styles.squareButton} ${styles.squareButtonDanger}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {!selectedCard ? null : (
          <>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Название</label>
              <input
                className={styles.input}
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                disabled={!selectedCardId || saving}
              />
            </div>

            <div>
              <div className={styles.levelsHeader}>
                <label className={styles.levelsLabel}>Уровни ({levels.length})</label>

                {levels.length < 10 && (
                  <button onClick={addLevel} className={styles.inlineAction}>
                    <Plus size={16} />
                    Добавить уровень
                  </button>
                )}
              </div>

              <div className={styles.levelTabs}>
                {levels.map((_, index) => {
                  const isActive = activeLevel === index

                  return (
                    <div
                      key={index}
                      onClick={() => setActiveLevel(index)}
                      className={
                        isActive
                          ? `${styles.levelTab} ${styles.levelTabActive} ${styles.levelTabRow}`
                          : `${styles.levelTab} ${styles.levelTabInactive} ${styles.levelTabRow}`
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setActiveLevel(index)
                      }}
                    >
                      <span className={styles.levelTabText}>Уровень {index + 1}</span>

                      <div className={styles.reorderGroup}>
                        <span
                          onClick={e => {
                            e.stopPropagation()
                            moveLevel(index, index - 1)
                          }}
                          title="Вверх"
                          className={
                            index === 0
                              ? `${styles.reorderIcon} ${styles.reorderIconDisabled}`
                              : styles.reorderIcon
                          }
                        >
                          <ChevronUp size={16} />
                        </span>

                        <span
                          onClick={e => {
                            e.stopPropagation()
                            moveLevel(index, index + 1)
                          }}
                          title="Вниз"
                          className={
                            index === levels.length - 1
                              ? `${styles.reorderIcon} ${styles.reorderIconDisabled}`
                              : styles.reorderIcon
                          }
                        >
                          <ChevronDown size={16} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.card}>
                {/* QA */}
                {active.kind === 'qa' ? (
                  <>
                    <MarkdownField
                      label="Вопрос"
                      value={active.question}
                      onChange={v => patchLevel(activeLevel, { question: v } as any)}
                      preview={qPreview}
                      onTogglePreview={() => setQPreview(p => !p)}
                      disabled={saving}
                    />

                    <MarkdownField
                      label="Ответ"
                      value={active.answer}
                      onChange={v => patchLevel(activeLevel, { answer: v } as any)}
                      preview={aPreview}
                      onTogglePreview={() => setAPreview(p => !p)}
                      disabled={saving}
                      className={styles.mt4}
                    />
                  </>
                ) : (
                  /* MCQ */
                  <>
                    <MarkdownField
                      label="Вопрос"
                      value={active.question}
                      onChange={v => patchLevel(activeLevel, { question: v } as any)}
                      preview={qPreview}
                      onTogglePreview={() => setQPreview(p => !p)}
                      disabled={saving}
                    />

                    <div className={styles.mt3}>
                      <label className={styles.formLabel}>Варианты</label>

                      {active.options.map((o, i) => (
                        <div key={o.id} className={styles.mcqOptionRow}>
                          <input
                            className={styles.input}
                            value={o.text}
                            onChange={e => patchOptionText(i, e.target.value)}
                            disabled={saving}
                            placeholder={`Вариант ${i + 1}`}
                          />

                          <button
                            onClick={() => moveOption(i, i - 1)}
                            disabled={i === 0 || saving}
                            title="Вверх"
                            className={`${styles.square40Button} ${styles.square40ButtonNeutral}`}
                          >
                            <ChevronUp size={16} />
                          </button>

                          <button
                            onClick={() => moveOption(i, i + 1)}
                            disabled={i === active.options.length - 1 || saving}
                            title="Вниз"
                            className={`${styles.square40Button} ${styles.square40ButtonNeutral}`}
                          >
                            <ChevronDown size={16} />
                          </button>

                          <button
                            onClick={() => removeOption(i)}
                            disabled={active.options.length <= 2 || saving}
                            title="Удалить вариант"
                            className={`${styles.square40Button} ${styles.square40ButtonDanger}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={addOption}
                        disabled={saving || active.options.length >= 8}
                        className={styles.inlineAction}
                      >
                        <Plus size={16} />
                        Добавить вариант
                      </button>
                    </div>

                    <div className={styles.mt3}>
                      <label className={styles.formLabel}>Правильный вариант</label>
                      <select
                        className={styles.input}
                        value={active.correctOptionId}
                        onChange={e =>
                          patchLevel(activeLevel, { correctOptionId: e.target.value } as any)
                        }
                        disabled={saving}
                      >
                        <option value="">— выбери —</option>
                        {active.options.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.text || o.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.mt3}>
                      <label className={styles.formLabel}>Таймер (сек)</label>
                      <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={active.timerSec}
                        onChange={e =>
                          patchLevel(activeLevel, { timerSec: Number(e.target.value) || 0 } as any)
                        }
                        disabled={saving}
                      />
                      <div className={styles.hintText}>
                        0 = без таймера (карточка не будет автопереворачиваться по времени).
                      </div>
                    </div>

                    <MarkdownField
                      label="Пояснение (показывать на обороте)"
                      value={active.explanation}
                      onChange={v => patchLevel(activeLevel, { explanation: v } as any)}
                      preview={aPreview}
                      onTogglePreview={() => setAPreview(p => !p)}
                      disabled={saving}
                      className={styles.mt4}
                    />
                  </>
                )}
              </div>

              {levels.length !== cleanedCount && (
                <div className={styles.noticeCard}>
                  <div className={styles.noticeText}>
                    Пустые уровни (недозаполненные) не будут сохранены.
                  </div>
                </div>
              )}
            </div>

            <div className={styles.bottomActions}>
              <Button
                onClick={onCancel}
                variant="secondary"
                size="large"
                fullWidth
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                onClick={saveCard}
                variant="primary"
                size="large"
                fullWidth
                disabled={!canSave}
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
