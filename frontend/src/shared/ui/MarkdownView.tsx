// src/shared/ui/MarkdownView.tsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { convertBracketLatexToDollar } from '@/shared/lib/latex/latexDelimiters'

export function MarkdownView({ value }: { value: string }) {
  const processed = convertBracketLatexToDollar(value ?? '')

  return (
    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
      {processed}
    </ReactMarkdown>
  )
}
