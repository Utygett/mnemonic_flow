// src/shared/lib/utils/latex-delimiters.ts
export function convertBracketLatexToDollar(src: string): string {
  if (!src) return src

  let text = src

  // Блочные формулы: \\[ ... \\] -> $$ ... $$
  text = text.replace(/\\\[(.*?)\\\]/gs, (_match, inner) => {
    return `$$\n${inner}\n$$`
  })

  // Инлайн-формулы: \\( ... \\) -> $...$
  text = text.replace(/\\\((.*?)\\\)/g, (_match, inner) => {
    return `$${inner}$`
  })

  return text
}
