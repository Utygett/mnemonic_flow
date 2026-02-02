// src\features\cards-create\ui\CreateCard.tsx
import React, { useEffect, useRef, useState } from 'react'
import { MarkdownField, MarkdownView } from '../../../shared/ui'
import { Input, Button } from '../../../shared/ui/legacy'
import { X, Plus, Trash2, Upload, Image as ImageIcon, Volume2, Mic } from 'lucide-react'
import { parseCsvNameFrontBack } from '../lib/csv'
import { LAST_DECK_KEY } from '../model/utils'
import { useCreateCardModel } from '../model/useCreateCardModel'
import { useCreateCardLevelsModel } from '../model/useCreateCardLevelsModel'
import type { CardType, CreateCardProps } from '../model/types'
import { apiRequest } from '@/shared/api'

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

    // raw levels state
    levelsQA,
    levelsMCQ,
    setLevelsQA,
    setLevelsMCQ,

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

    // image actions
    setLevelQuestionImage,
    removeLevelQuestionImage,
    setLevelAnswerImage,
    removeLevelAnswerImage,
    setOptionImage,

    // audio actions
    setLevelQuestionAudio,
    removeLevelQuestionAudio,
    setLevelAnswerAudio,
    removeLevelAnswerAudio,

    // cleaned (готово для onSave)
    cleanedLevelsQA,
    cleanedLevelsMCQ,
  } = useCreateCardLevelsModel(cardType)

  // CSV import
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const reportRef = useRef<HTMLDivElement | null>(null)

  const [importBusy, setImportBusy] = useState(false)
  const [importReport, setImportReport] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  // Recording state
  const [isRecordingQuestion, setIsRecordingQuestion] = useState(false)
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const scrollToReport = () => {
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const safeTerm = typeof term === 'string' ? term : ''

  const canSave =
    safeTerm.trim() &&
    deckId &&
    (cardType === 'flashcard' ? cleanedLevelsQA.length > 0 : cleanedLevelsMCQ.length > 0)

  const handleSave = async () => {
    if (!canSave || saveBusy) return

    setSaveBusy(true)
    setUploadProgress(null)

    try {
      let cardId: string | undefined

      // Create card first
      if (cardType === 'flashcard') {
        const result = (await onSave({
          deckId,
          term: safeTerm.trim(),
          type: 'flashcard',
          levels: cleanedLevelsQA,
        })) as any
        cardId = result?.card_id
      } else {
        const result = (await onSave({
          deckId,
          term: safeTerm.trim(),
          type: 'multiple_choice',
          levels: cleanedLevelsMCQ,
        })) as any
        cardId = result?.card_id
      }

      // Upload images if card was created
      if (cardId) {
        try {
          if (cardType === 'flashcard') {
            // Upload level images for flashcard
            for (let levelIndex = 0; levelIndex < cleanedLevelsQA.length; levelIndex++) {
              const level = levelsQA[levelIndex]
              if (!level) continue

              // Upload question images
              for (const img of level.questionImageFiles) {
                setUploadProgress(`Загрузка изображений вопроса для уровня ${levelIndex + 1}...`)
                const formData = new FormData()
                formData.append('file', img.file)
                await apiRequest(`/cards/${cardId}/levels/${levelIndex}/question-image`, {
                  method: 'POST',
                  body: formData,
                })
              }

              // Upload answer images
              for (const img of level.answerImageFiles) {
                setUploadProgress(`Загрузка изображений ответа для уровня ${levelIndex + 1}...`)
                const formData = new FormData()
                formData.append('file', img.file)
                await apiRequest(`/cards/${cardId}/levels/${levelIndex}/answer-image`, {
                  method: 'POST',
                  body: formData,
                })
              }

              // Upload question audio
              for (const audio of level.questionAudioFiles) {
                setUploadProgress(`Загрузка аудио вопроса для уровня ${levelIndex + 1}...`)
                const formData = new FormData()
                formData.append('file', audio.file)
                await apiRequest(`/cards/${cardId}/levels/${levelIndex}/question-audio`, {
                  method: 'POST',
                  body: formData,
                })
              }

              // Upload answer audio
              for (const audio of level.answerAudioFiles) {
                setUploadProgress(`Загрузка аудио ответа для уровня ${levelIndex + 1}...`)
                const formData = new FormData()
                formData.append('file', audio.file)
                await apiRequest(`/cards/${cardId}/levels/${levelIndex}/answer-audio`, {
                  method: 'POST',
                  body: formData,
                })
              }
            }
          } else {
            // Upload MCQ option images
            for (let levelIndex = 0; levelIndex < cleanedLevelsMCQ.length; levelIndex++) {
              const level = levelsMCQ[levelIndex]
              if (!level) continue

              for (const option of level.options || []) {
                if (option.imageFile) {
                  setUploadProgress(`Загрузка изображения для варианта...`)
                  const formData = new FormData()
                  formData.append('file', option.imageFile)
                  formData.append('option_id', option.id)
                  await apiRequest(`/cards/${cardId}/option-image`, {
                    method: 'POST',
                    body: formData,
                  })
                }
              }
            }
          }
        } catch (uploadError) {
          console.error('File upload failed:', uploadError)
          alert(
            'Карточка создана, но некоторые файлы не были загружены. Попробуйте добавить их через редактирование.'
          )
        }
      }
    } finally {
      setSaveBusy(false)
      setUploadProgress(null)
    }
  }

  const handleQuestionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение (JPG, PNG, WebP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5МБ')
      return
    }

    setLevelQuestionImage(activeLevel, file)
  }

  const handleAnswerImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение (JPG, PNG, WebP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5МБ')
      return
    }

    setLevelAnswerImage(activeLevel, file)
  }

  const handleQuestionAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg']
    if (!allowedTypes.includes(file.type)) {
      alert('Пожалуйста, выберите аудиофайл (MP3, M4A, WAV, WebM, OGG)')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10МБ')
      return
    }

    setLevelQuestionAudio(activeLevel, file)
  }

  const handleAnswerAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg']
    if (!allowedTypes.includes(file.type)) {
      alert('Пожалуйста, выберите аудиофайл (MP3, M4A, WAV, WebM, OGG)')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10МБ')
      return
    }

    setLevelAnswerAudio(activeLevel, file)
  }

  const startQuestionRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        setLevelQuestionAudio(activeLevel, audioFile)

        stream.getTracks().forEach(track => track.stop())
        setIsRecordingQuestion(false)
      }

      mediaRecorder.start()
      setIsRecordingQuestion(true)
    } catch (err) {
      console.error('Microphone access error:', err)
      alert('Не удалось получить доступ к микрофону')
    }
  }

  const stopQuestionRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const startAnswerRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        setLevelAnswerAudio(activeLevel, audioFile)

        stream.getTracks().forEach(track => track.stop())
        setIsRecordingAnswer(false)
      }

      mediaRecorder.start()
      setIsRecordingAnswer(true)
    } catch (err) {
      console.error('Microphone access error:', err)
      alert('Не удалось получить доступ к микрофону')
    }
  }

  const stopAnswerRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleOptionImageSelect =
    (optionId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение (JPG, PNG, WebP)')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5МБ')
        return
      }

      setOptionImage(activeLevel, optionId, file)
    }

  const removeOptionImage = (optionId: string) => () => {
    setOptionImage(activeLevel, optionId, null)
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

                {/* Question Image Upload */}
                <div className={styles.inlineImageUpload}>
                  <div className={styles.imagesList}>
                    {activeQA?.questionImageFiles?.map((img, idx) => (
                      <div key={idx} className={styles.imagePreviewSmall}>
                        <img
                          src={img.preview}
                          alt={`Question image ${idx + 1}`}
                          className={styles.previewImgSmall}
                        />
                        <button
                          type="button"
                          onClick={() => removeLevelQuestionImage(activeLevel, idx)}
                          className={styles.removeImageButton}
                          disabled={saveBusy}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {activeQA?.questionImageFiles?.length < 10 && (
                    <label className={styles.inlineUploadButton}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleQuestionImageSelect}
                        disabled={saveBusy}
                        style={{ display: 'none' }}
                      />
                      <ImageIcon size={18} />
                      <span>Добавить изображение</span>
                    </label>
                  )}
                </div>

                {/* Question Audio Upload */}
                <div className={styles.inlineImageUpload}>
                  <div className={styles.audioList}>
                    {activeQA?.questionAudioFiles?.map((audio, idx) => (
                      <div key={idx} className={styles.audioPreviewSmall}>
                        <audio src={audio.preview} controls className={styles.audioPlayerSmall} />
                        <button
                          type="button"
                          onClick={() => removeLevelQuestionAudio(activeLevel, idx)}
                          className={styles.removeImageButton}
                          disabled={saveBusy}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {activeQA?.questionAudioFiles?.length < 10 && (
                    <div className={styles.audioButtonsRow}>
                      <label className={styles.inlineUploadButton}>
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
                          onChange={handleQuestionAudioSelect}
                          disabled={saveBusy || isRecordingQuestion}
                          style={{ display: 'none' }}
                        />
                        <Volume2 size={18} />
                        <span>Загрузить</span>
                      </label>
                      <button
                        type="button"
                        onClick={
                          isRecordingQuestion ? stopQuestionRecording : startQuestionRecording
                        }
                        disabled={saveBusy}
                        className={`${styles.inlineUploadButton} ${isRecordingQuestion ? styles.recording : ''}`}
                      >
                        <Mic
                          size={18}
                          className={isRecordingQuestion ? styles.recordingIcon : ''}
                        />
                        <span>{isRecordingQuestion ? 'Стоп' : 'Записать'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <MarkdownField
                  label="Ответ"
                  value={activeQA?.answer ?? ''}
                  onChange={v => patchLevelQA(activeLevel, { answer: v })}
                  preview={aPreview}
                  onTogglePreview={() => setAPreview(!aPreview)}
                  className={styles.mt4}
                />

                {/* Answer Image Upload */}
                <div className={styles.inlineImageUpload}>
                  <div className={styles.imagesList}>
                    {activeQA?.answerImageFiles?.map((img, idx) => (
                      <div key={idx} className={styles.imagePreviewSmall}>
                        <img
                          src={img.preview}
                          alt={`Answer image ${idx + 1}`}
                          className={styles.previewImgSmall}
                        />
                        <button
                          type="button"
                          onClick={() => removeLevelAnswerImage(activeLevel, idx)}
                          className={styles.removeImageButton}
                          disabled={saveBusy}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {activeQA?.answerImageFiles?.length < 10 && (
                    <label className={styles.inlineUploadButton}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAnswerImageSelect}
                        disabled={saveBusy}
                        style={{ display: 'none' }}
                      />
                      <ImageIcon size={18} />
                      <span>Добавить изображение</span>
                    </label>
                  )}
                </div>

                {/* Answer Audio Upload */}
                <div className={styles.inlineImageUpload}>
                  <div className={styles.audioList}>
                    {activeQA?.answerAudioFiles?.map((audio, idx) => (
                      <div key={idx} className={styles.audioPreviewSmall}>
                        <audio src={audio.preview} controls className={styles.audioPlayerSmall} />
                        <button
                          type="button"
                          onClick={() => removeLevelAnswerAudio(activeLevel, idx)}
                          className={styles.removeImageButton}
                          disabled={saveBusy}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {activeQA?.answerAudioFiles?.length < 10 && (
                    <div className={styles.audioButtonsRow}>
                      <label className={styles.inlineUploadButton}>
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
                          onChange={handleAnswerAudioSelect}
                          disabled={saveBusy || isRecordingAnswer}
                          style={{ display: 'none' }}
                        />
                        <Volume2 size={18} />
                        <span>Загрузить</span>
                      </label>
                      <button
                        type="button"
                        onClick={isRecordingAnswer ? stopAnswerRecording : startAnswerRecording}
                        disabled={saveBusy}
                        className={`${styles.inlineUploadButton} ${isRecordingAnswer ? styles.recording : ''}`}
                      >
                        <Mic size={18} className={isRecordingAnswer ? styles.recordingIcon : ''} />
                        <span>{isRecordingAnswer ? 'Стоп' : 'Записать'}</span>
                      </button>
                    </div>
                  )}
                </div>

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

                        {/* Option Image Upload */}
                        <div className={styles.optionImageUpload}>
                          {opt.imagePreview ? (
                            <div className={styles.imagePreviewSmall}>
                              <img
                                src={opt.imagePreview}
                                alt={`Option ${idx + 1} preview`}
                                className={styles.previewImgSmall}
                              />
                              <button
                                type="button"
                                onClick={removeOptionImage(opt.id)}
                                className={styles.removeImageButton}
                                disabled={saveBusy}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label className={styles.inlineUploadButton}>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleOptionImageSelect(opt.id)}
                                disabled={saveBusy}
                                style={{ display: 'none' }}
                              />
                              <ImageIcon size={16} />
                              <span>Добавить изображение</span>
                            </label>
                          )}
                        </div>
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

        {uploadProgress && <div className={styles.uploadProgress}>{uploadProgress}</div>}

        <div className={styles.bottomActions}>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            size="large"
            fullWidth
            disabled={!deckId || importBusy || saveBusy}
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
            disabled={importBusy || saveBusy}
          >
            Отмена
          </Button>

          <Button
            onClick={handleSave}
            variant="primary"
            size="large"
            fullWidth
            disabled={!canSave || importBusy || saveBusy}
          >
            {saveBusy ? 'Сохранение...' : 'Сохранить'}
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
