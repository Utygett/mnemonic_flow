// src/shared/ui/MarkdownView.tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { convertBracketLatexToDollar } from '@/shared/lib/utils'
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

  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
