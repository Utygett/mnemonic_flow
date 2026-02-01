// src/shared/lib/utils/latex-delimiters.ts
export function convertBracketLatexToDollar(src: string): string {
  if (!src) return src

  let text = src

  // Блочные формулы: \\[ ... \\] -> $$ ... $$
  text = text.replace(/\\\[\s*\n?(.*?)\n?\s*\\\]/gs, (_match, inner) => {
    return `$$\n${inner.trim()}\n$$`
  })

  // Инлайн-формулы: \\( ... \\) -> $...$
  text = text.replace(/\\\(\s*(.*?)\s*\\\)/g, (_match, inner) => {
    return `$${inner.trim()}$`
  })

  return text
}
