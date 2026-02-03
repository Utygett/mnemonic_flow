import React from 'react'
import MDEditor from '@uiw/react-md-editor'
import { Eye, EyeOff } from 'lucide-react'
import { MarkdownView } from './MarkdownView'
import styles from './MarkdownField.module.css'

type Props = {
  label: string
  value: string
  onChange: (next: string) => void

  preview: boolean
  onTogglePreview: () => void

  disabled?: boolean
  emptyPreviewText?: string
  className?: string
}

export function MarkdownField({
  label,
  value,
  onChange,
  preview,
  onTogglePreview,
  disabled = false,
  emptyPreviewText = '*Пусто*',
  className,
}: Props) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>

        <button
          type="button"
          onClick={onTogglePreview}
          className={styles.previewToggle}
          aria-label={preview ? 'Выключить предпросмотр' : 'Включить предпросмотр'}
          title={preview ? 'Выключить предпросмотр' : 'Включить предпросмотр'}
          disabled={disabled}
        >
          {preview ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {!preview ? (
        <div className={styles.editorWrapper} data-color-mode="auto">
          <MDEditor
            value={value}
            onChange={v => onChange(v ?? '')}
            preview="edit"
            extraCommands={[]}
            visibleDragbar={false}
            textareaProps={{
              placeholder: 'Введите текст...',
            }}
          />
        </div>
      ) : (
        <div className={styles.previewWrapper}>
          <MarkdownView value={value.trim() ? value : emptyPreviewText} />
        </div>
      )}
    </div>
  )
}
