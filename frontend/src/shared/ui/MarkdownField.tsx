import React from 'react'
import MDEditor from '@uiw/react-md-editor'
import { Eye, EyeOff } from 'lucide-react'
import { MarkdownView } from './MarkdownView'

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
    <div className={className}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>
          {label}
        </label>

        <button
          type="button"
          onClick={onTogglePreview}
          className="icon-btn icon-btn--raise"
          aria-label={preview ? 'Выключить предпросмотр' : 'Включить предпросмотр'}
          title={preview ? 'Выключить предпросмотр' : 'Включить предпросмотр'}
          disabled={disabled}
        >
          {preview ? <EyeOff size={24} /> : <Eye size={24} />}
        </button>
      </div>

      {!preview ? (
        <MDEditor
          value={value}
          onChange={v => onChange(v ?? '')}
          preview="edit"
          extraCommands={[]}
          visibleDragbar={false}
        />
      ) : (
        <MarkdownView value={value.trim() ? value : emptyPreviewText} />
      )}
    </div>
  )
}
