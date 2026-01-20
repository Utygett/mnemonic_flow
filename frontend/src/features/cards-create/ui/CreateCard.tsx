// src\features\cards-create\ui\CreateCard.tsx
import React, { useEffect, useRef, useState } from 'react'
import { MarkdownField, MarkdownView } from '../../../shared/ui'
import { Input, Button } from '../../../shared/ui/legacy'
import { X, Plus, Trash2, Upload } from 'lucide-react'
import { parseCsvNameFrontBack } from '../lib/csv'
import { LAST_DECK_KEY } from '../model/utils'
import { useCreateCardModel } from '../model/useCreateCardModel'
import { useCreateCardLevelsModel } from '../model/useCreateCardLevelsModel'
import type { CardType, CreateCardProps } from '../model/types'

import styles from './CreateCard.module.css'

export function CreateCard({ decks, onSave, onSaveMany, onCancel }: CreateCardProps) {
  const { term, setTerm, cardType, setCardType, deckId, setDeckId } = useCreateCardModel(decks)

  const {
    activeLevel,
    setActiveLevel,

    // preview toggles
    qPreview,
    setQPreview,
    aPreview,
    setAPreview,
    mcqQPreview,
    setMcqQPreview,
    mcqOptionsPreview,
    setMcqOptionsPreview,
    mcqExplanationPreview,
    setMcqExplanationPreview,

    // derived
    levelsCount,
    activeQA,
    activeMCQ,

    // actions
    addLevel,
    removeLevel,
    patchLevelQA,
    patchLevelMCQ,
    patchMcqOption,
    addMcqOption,
    removeMcqOption,

    // cleaned (готово для onSave)
    cleanedLevelsQA,
    cleanedLevelsMCQ,
  } = useCreateCardLevelsModel(cardType)

  // CSV import
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const reportRef = useRef<HTMLDivElement | null>(null)

  const [importBusy, setImportBusy] = useState(false)
  const [importReport, setImportReport] = useState<string | null>(null)

  const scrollToReport = () => {
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const safeTerm = typeof term === 'string' ? term : ''

  const canSave =
    safeTerm.trim() &&
    deckId &&
    (cardType === 'flashcard' ? cleanedLevelsQA.length > 0 : cleanedLevelsMCQ.length > 0)

  const handleSave = () => {
    if (!canSave) return

    if (cardType === 'flashcard') {
      onSave({ deckId, term: safeTerm.trim(), type: 'flashcard', levels: cleanedLevelsQA })
    } else {
      onSave({ deckId, term: safeTerm.trim(), type: 'multiple_choice', levels: cleanedLevelsMCQ })
    }
  }

  const handleImportCsv = async (file: File) => {
    if (!deckId) return

    setImportReport(null)
    setImportBusy(true)

    try {
      const text = await file.text()
      const { rows, errors, total } = parseCsvNameFrontBack(text)

      // 1) Если ошибки парсинга — ОТВЕРГАЕМ импорт полностью
      if (errors.length > 0) {
        const head = `Импорт отменён: ошибок парсинга ${errors.length} из ${total} строк.\nИсправь CSV и попробуй снова.`
        const body = `\n\nОшибки:\n- ${errors.slice(0, 20).join('\n- ')}${errors.length > 20 ? '\n- ...' : ''}`

        const msg = head + body
        setImportReport(msg)
        scrollToReport()
        alert(msg)
        return
      }

      // 2) Парсинг ok → формируем payload и шлём
      const cards = rows.map(r => ({
        deckId,
        term: r.name,
        type: 'flashcard' as const,
        levels: [{ question: r.front, answer: r.back }],
      }))

      const result = await onSaveMany(cards)

      const sent = cards.length
      const created = result.created ?? 0
      const failed = result.failed ?? 0
      const apiErrors = result.errors ?? []

      const tail =
        apiErrors.length > 0
          ? `\n\nОшибки API (index: message):\n- ${apiErrors.slice(0, 20).join('\n- ')}${
              apiErrors.length > 20 ? '\n- ...' : ''
            }`
          : ''

      const msg = `Импорт завершён: отправлено ${sent}, создано в базе ${created}, ошибок API ${failed}.${tail}`
      setImportReport(msg)
      scrollToReport()
      alert(msg)
    } catch (e: any) {
      const msg = `Импорт не удался: ${String(e?.message ?? e)}`
      setImportReport(msg)
      scrollToReport()
      alert(msg)
    } finally {
      setImportBusy(false)
    }
  }

  // default deck selection
  useEffect(() => {
    if (!decks || decks.length === 0) return
    if (deckId && decks.some(d => d.deck_id === deckId)) return
    setDeckId(decks[0].deck_id)
  }, [decks, deckId, setDeckId])

  // persist last deck
  useEffect(() => {
    if (!deckId) return
    localStorage.setItem(LAST_DECK_KEY, deckId)
  }, [deckId])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerRow}>
            <button
              onClick={onCancel}
              className={styles.iconButton}
              type="button"
              aria-label="Закрыть"
            >
              <X size={24} />
            </button>
            <h2 className={styles.headerTitle}>Новая карточка</h2>
            <div className={styles.headerSpacer} />
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.formRow}>
          <label className={styles.formLabel}>Колода</label>
          <select
            value={deckId}
            onChange={e => setDeckId(e.target.value)}
            className={styles.input}
            disabled={decks.length === 0}
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
        </div>

        <div className={styles.formRow}>
          <label className={styles.formLabel}>Тип карточки</label>
          <select
            value={cardType}
            onChange={e => setCardType(e.target.value as CardType)}
            className={styles.input}
          >
            <option value="flashcard">Flashcard</option>
            <option value="multiple_choice">Multiple choice</option>
          </select>
        </div>

        <Input
          value={safeTerm}
          onChange={setTerm}
          label="Название / Тема карточки"
          placeholder="Например: Фотосинтез"
        />

        <div>
          <div className={styles.levelsHeader}>
            <label className={styles.levelsLabel}>Уровни сложности ({levelsCount})</label>

            {levelsCount < 10 && (
              <button onClick={addLevel} className={styles.inlineAction} type="button">
                <Plus size={16} />
                Добавить уровень
              </button>
            )}
          </div>

          <div className={styles.levelTabs}>
            {Array.from({ length: levelsCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveLevel(index)}
                className={
                  activeLevel === index
                    ? `${styles.levelTab} ${styles.levelTabActive}`
                    : `${styles.levelTab} ${styles.levelTabInactive}`
                }
                type="button"
              >
                <span className={styles.levelTabText}>Уровень {index + 1}</span>
              </button>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardTopBar}>
              <div className={styles.cardTopBarLeft}>
                {levelsCount > 1 && (
                  <button
                    onClick={() => removeLevel(activeLevel)}
                    className={styles.dangerIconButton}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {cardType === 'flashcard' ? (
              <>
                <MarkdownField
                  label="Вопрос"
                  value={activeQA?.question ?? ''}
                  onChange={v => patchLevelQA(activeLevel, { question: v })}
                  preview={qPreview}
                  onTogglePreview={() => setQPreview(!qPreview)}
                />

                <MarkdownField
                  label="Ответ"
                  value={activeQA?.answer ?? ''}
                  onChange={v => patchLevelQA(activeLevel, { answer: v })}
                  preview={aPreview}
                  onTogglePreview={() => setAPreview(!aPreview)}
                  className={styles.mt4}
                />

                <div className={styles.formRow} style={{ marginTop: '1rem' }}>
                  <label className={styles.formLabel}>Таймер (сек) — опционально</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={3600}
                    value={typeof activeQA?.timerSec === 'number' ? String(activeQA.timerSec) : ''}
                    onChange={e => {
                      const raw = e.target.value
                      if (raw === '') {
                        patchLevelQA(activeLevel, { timerSec: undefined })
                        return
                      }
                      const n = Number(raw)
                      const v = Number.isFinite(n) ? Math.max(0, Math.min(3600, Math.trunc(n))) : 0
                      patchLevelQA(activeLevel, { timerSec: v })
                    }}
                    placeholder="Напр. 15"
                  />
                </div>
              </>
            ) : (
              <>
                <MarkdownField
                  label="Вопрос"
                  value={activeMCQ?.question ?? ''}
                  onChange={v => patchLevelMCQ(activeLevel, { question: v })}
                  preview={mcqQPreview}
                  onTogglePreview={() => setMcqQPreview(!mcqQPreview)}
                />

                <div className={styles.formRow} style={{ marginTop: '1rem' }}>
                  <label className={styles.formLabel}>Таймер (сек) — опционально</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={3600}
                    value={
                      typeof activeMCQ?.timerSec === 'number' ? String(activeMCQ.timerSec) : ''
                    }
                    onChange={e => {
                      const raw = e.target.value
                      if (raw === '') {
                        patchLevelMCQ(activeLevel, { timerSec: undefined })
                        return
                      }
                      const n = Number(raw)
                      const v = Number.isFinite(n) ? Math.max(0, Math.min(3600, Math.trunc(n))) : 0
                      patchLevelMCQ(activeLevel, { timerSec: v })
                    }}
                    placeholder="Напр. 15"
                  />
                </div>

                <div className={styles.mt4}>
                  <div className={styles.optionsHeader}>
                    <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                      Варианты (выбери правильный)
                    </label>

                    <button
                      onClick={() => addMcqOption(activeLevel)}
                      className={styles.inlineAction}
                      type="button"
                    >
                      <Plus size={16} />
                      Добавить вариант
                    </button>
                  </div>

                  <div className={styles.optionsList}>
                    {(activeMCQ?.options ?? []).map((opt, idx) => (
                      <div key={opt.id} className={styles.optionCard}>
                        <div className={styles.optionHeaderRow}>
                          <label className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`mcq-correct-${activeLevel}`}
                              checked={String(activeMCQ?.correctOptionId) === String(opt.id)}
                              onChange={() =>
                                patchLevelMCQ(activeLevel, { correctOptionId: String(opt.id) })
                              }
                            />
                            Правильный
                          </label>

                          <div className={styles.flex1} />

                          <button
                            type="button"
                            onClick={() => removeMcqOption(activeLevel, opt.id)}
                            disabled={(activeMCQ?.options?.length ?? 0) <= 2}
                            className={styles.deleteOptionButton}
                            title="Удалить вариант"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <MarkdownField
                          label={`Вариант ${idx + 1}`}
                          value={opt.text}
                          onChange={v => patchMcqOption(activeLevel, opt.id, { text: v })}
                          preview={mcqOptionsPreview}
                          onTogglePreview={() => setMcqOptionsPreview(!mcqOptionsPreview)}
                        />
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const correct = (activeMCQ?.options ?? []).find(
                      o => o.id === activeMCQ?.correctOptionId
                    )
                    const text = correct?.text?.trim()
                    if (!text) return null
                    return (
                      <div className={styles.mt4}>
                        <div className={styles.previewLabel}>Предпросмотр правильного ответа</div>
                        <div className={styles.optionCard}>
                          <MarkdownView value={text} />
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <MarkdownField
                  label="Пояснение (опционально)"
                  value={activeMCQ?.explanation ?? ''}
                  onChange={v => patchLevelMCQ(activeLevel, { explanation: v })}
                  preview={mcqExplanationPreview}
                  onTogglePreview={() => setMcqExplanationPreview(!mcqExplanationPreview)}
                  className={styles.mt4}
                />
              </>
            )}
          </div>
        </div>

        <div className={styles.bottomActions}>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            size="large"
            fullWidth
            disabled={!deckId || importBusy}
          >
            <span className={styles.buttonIconRow}>
              <Upload size={16} />
              Импорт CSV
            </span>
          </Button>

          <Button
            onClick={onCancel}
            variant="secondary"
            size="large"
            fullWidth
            disabled={importBusy}
          >
            Отмена
          </Button>

          <Button
            onClick={handleSave}
            variant="primary"
            size="large"
            fullWidth
            disabled={!canSave || importBusy}
          >
            Сохранить
          </Button>
        </div>

        {importReport && (
          <div ref={reportRef} className={styles.report}>
            {importReport}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={async () => {
            const input = fileInputRef.current
            const file = input?.files?.[0]
            if (!file) return

            try {
              await handleImportCsv(file)
            } finally {
              if (fileInputRef.current) fileInputRef.current.value = ''
            }
          }}
        />
      </main>
    </div>
  )
}
