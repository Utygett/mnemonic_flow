// src/features/cards-edit/ui/EditCardView.tsx
import React from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react'

import { Button } from '../../../shared/ui/Button/Button'
import { MarkdownField } from '../../../shared/ui/MarkdownField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/kit/select'
import { CardImageUpload } from '@/features/card-image-upload'
import { CardAudioUpload } from '@/features/card-audio'

import type { EditCardViewModel } from '../model/useEditCardModel'

import styles from './EditCardView.module.css'

type Props = EditCardViewModel & {
  onCancel: () => void
}

const NONE_VALUE = '__none__'

export function EditCardView(props: Props) {
  const {
    mode,

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

  const isSessionMode = mode === 'session'

  const active = levels[activeLevel]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerRow}>
            <button onClick={onCancel} className={styles.iconButton}>
              <X size={24} />
            </button>
            <h2 className={styles.headerTitle}>
              {isSessionMode ? 'Редактировать карточку' : 'Редактирование уровней'}
            </h2>
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
        {isSessionMode ? null : (
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Колода</label>

            <div className={styles.rowWithActions}>
              <Select
                value={String(deckId ?? '')}
                onValueChange={setDeckId}
                disabled={decks.length === 0 || saving}
              >
                <SelectTrigger className={styles.input}>
                  <SelectValue
                    placeholder={decks.length === 0 ? 'Нет доступных колод' : 'Выбери колоду'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {decks.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Нет доступных колод
                    </SelectItem>
                  ) : (
                    decks.map(d => (
                      <SelectItem key={d.deck_id} value={String(d.deck_id)}>
                        {d.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

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
        )}

        {/* Card */}
        {isSessionMode ? null : (
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Карточка</label>

            <div className={styles.rowWithActions}>
              <Select
                value={String(selectedCardId ?? '')}
                onValueChange={setSelectedCardId}
                disabled={loading || cards.length === 0 || saving}
              >
                <SelectTrigger className={styles.input}>
                  <SelectValue placeholder={loading ? 'Загрузка…' : 'Выбери карточку'} />
                </SelectTrigger>
                <SelectContent>
                  {loading ? (
                    <SelectItem value="__loading" disabled>
                      Загрузка…
                    </SelectItem>
                  ) : null}
                  {cards.map(c => (
                    <SelectItem key={c.card_id} value={String(c.card_id)}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
        )}

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
                    {/* Question Section */}
                    <div className={styles.sideSection}>
                      <h4 className={styles.sideSectionTitle}>Вопрос</h4>
                      <div className={styles.sideSectionContent}>
                        <MarkdownField
                          label="Текст вопроса"
                          value={active.question}
                          onChange={v => patchLevel(activeLevel, { question: v } as any)}
                          preview={qPreview}
                          onTogglePreview={() => setQPreview(p => !p)}
                          disabled={saving}
                        />
                        <div className={styles.mt3}>
                          <CardImageUpload
                            cardId={selectedCardId}
                            levelIndex={activeLevel}
                            side="question"
                            currentImageUrls={(active as any)?.question_image_urls}
                            onImagesChange={urls =>
                              patchLevel(activeLevel, { question_image_urls: urls } as any)
                            }
                          />
                          <div className={styles.mt3}>
                            <CardAudioUpload
                              cardId={selectedCardId}
                              levelIndex={activeLevel}
                              side="question"
                              currentAudioUrls={(active as any)?.question_audio_urls}
                              onAudiosChange={urls =>
                                patchLevel(activeLevel, { question_audio_urls: urls } as any)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Answer Section */}
                    <div className={styles.sideSection}>
                      <h4 className={styles.sideSectionTitle}>Ответ</h4>
                      <div className={styles.sideSectionContent}>
                        <MarkdownField
                          label="Текст ответа"
                          value={active.answer}
                          onChange={v => patchLevel(activeLevel, { answer: v } as any)}
                          preview={aPreview}
                          onTogglePreview={() => setAPreview(p => !p)}
                          disabled={saving}
                        />
                        <div className={styles.mt3}>
                          <CardImageUpload
                            cardId={selectedCardId}
                            levelIndex={activeLevel}
                            side="answer"
                            currentImageUrls={(active as any)?.answer_image_urls}
                            onImagesChange={urls =>
                              patchLevel(activeLevel, { answer_image_urls: urls } as any)
                            }
                          />
                          <div className={styles.mt3}>
                            <CardAudioUpload
                              cardId={selectedCardId}
                              levelIndex={activeLevel}
                              side="answer"
                              currentAudioUrls={(active as any)?.answer_audio_urls}
                              onAudiosChange={urls =>
                                patchLevel(activeLevel, { answer_audio_urls: urls } as any)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* MCQ */
                  <>
                    {/* Question Section */}
                    <div className={styles.sideSection}>
                      <h4 className={styles.sideSectionTitle}>Вопрос</h4>
                      <div className={styles.sideSectionContent}>
                        <MarkdownField
                          label="Текст вопроса"
                          value={active.question}
                          onChange={v => patchLevel(activeLevel, { question: v } as any)}
                          preview={qPreview}
                          onTogglePreview={() => setQPreview(p => !p)}
                          disabled={saving}
                        />
                        <div className={styles.mt3}>
                          <CardImageUpload
                            cardId={selectedCardId}
                            levelIndex={activeLevel}
                            side="question"
                            currentImageUrls={(active as any)?.question_image_urls}
                            onImagesChange={urls =>
                              patchLevel(activeLevel, { question_image_urls: urls } as any)
                            }
                          />
                          <div className={styles.mt3}>
                            <CardAudioUpload
                              cardId={selectedCardId}
                              levelIndex={activeLevel}
                              side="question"
                              currentAudioUrls={(active as any)?.question_audio_urls}
                              onAudiosChange={urls =>
                                patchLevel(activeLevel, { question_audio_urls: urls } as any)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Answer Section */}
                    <div className={styles.sideSection}>
                      <h4 className={styles.sideSectionTitle}>Ответ</h4>
                      <div className={styles.sideSectionContent}>
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
                          <Select
                            value={
                              active.correctOptionId ? String(active.correctOptionId) : NONE_VALUE
                            }
                            onValueChange={v =>
                              patchLevel(activeLevel, {
                                correctOptionId: v === NONE_VALUE ? '' : String(v),
                              } as any)
                            }
                            disabled={saving}
                          >
                            <SelectTrigger className={styles.input}>
                              <SelectValue placeholder="— выбери —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>— выбери —</SelectItem>
                              {active.options.map(o => (
                                <SelectItem key={o.id} value={String(o.id)}>
                                  {o.text || o.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className={styles.mt3}>
                          <label className={styles.formLabel}>Таймер (сек)</label>
                          <input
                            className={styles.input}
                            type="number"
                            min={0}
                            value={active.timerSec}
                            onChange={e =>
                              patchLevel(activeLevel, {
                                timerSec: Number(e.target.value) || 0,
                              } as any)
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

                        <div className={styles.mt3}>
                          <CardImageUpload
                            cardId={selectedCardId}
                            levelIndex={activeLevel}
                            side="answer"
                            currentImageUrls={(active as any)?.answer_image_urls}
                            onImagesChange={urls =>
                              patchLevel(activeLevel, { answer_image_urls: urls } as any)
                            }
                          />
                          <div className={styles.mt3}>
                            <CardAudioUpload
                              cardId={selectedCardId}
                              levelIndex={activeLevel}
                              side="answer"
                              currentAudioUrls={(active as any)?.answer_audio_urls}
                              onAudiosChange={urls =>
                                patchLevel(activeLevel, { answer_audio_urls: urls } as any)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
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
