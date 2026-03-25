// src/shared/ui/MarkdownView.tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { convertBracketLatexToDollar } from '@/shared/lib/utils'
import { useLineCount } from './hooks/useLineCount'
import styles from './MarkdownView.module.css'

const components = {
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className={styles.tableWrapper}>
      <table {...props}>{children}</table>
    </div>
  ),
}

export function MarkdownView({ value }: { value: string }) {
  const processed = convertBracketLatexToDollar(value ?? '')
  const { hasManyLines, ref } = useLineCount([value])

  // Determine alignment class based on line count
  const alignmentClass =
    hasManyLines === null
      ? '' // Still calculating, use default
      : hasManyLines
        ? styles.alignLeft
        : styles.alignCenter

  return (
    <div className={styles.markdownContent} ref={ref}>
      <div className={alignmentClass}>
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={components}
        >
          {processed}
        </ReactMarkdown>
      </div>
    </div>
  )
}
