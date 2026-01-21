// Converts LaTeX delimiters from \( \) and \[ \] to $ and $$
// Useful because remark-math expects dollar delimiters.

export function convertBracketLatexToDollar(input: string): string {
  if (!input) return ''

  // Inline math
  let out = input.replace(/\\\(/g, '$').replace(/\\\)/g, '$')

  // Block math
  out = out.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')

  return out
}
