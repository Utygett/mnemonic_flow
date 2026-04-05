// src/shared/ui/hooks/useLineCount.ts
import { useEffect, useState, useRef } from 'react'

/**
 * Hook to detect the number of rendered text lines in an element.
 * Returns `true` if the element has 5 or more lines, `false` otherwise.
 *
 * @param deps - Dependencies to trigger recalculation (e.g., text content changes)
 * @returns boolean indicating if content has 5+ lines
 */
export function useHasManyLines(deps: unknown[] = []): boolean | null {
  const [hasManyLines, setHasManyLines] = useState<boolean | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      setHasManyLines(null)
      return
    }

    // Calculate line count using getClientRects
    // This method considers actual rendered line breaks from wrapping
    const textNode = element.firstChild
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange()
      range.selectNodeContents(textNode)
      const rects = range.getClientRects()
      const lineCount = rects.length

      // For more complex content with multiple child nodes, use a different approach
      if (lineCount > 0) {
        setHasManyLines(lineCount >= 5)
        return
      }
    }

    // Fallback: estimate by height / line-height
    const computedStyle = window.getComputedStyle(element)
    const lineHeight = parseFloat(computedStyle.lineHeight)
    const height = element.clientHeight
    const fontSize = parseFloat(computedStyle.fontSize)

    // If line-height is 'normal', estimate as 1.2 * font-size
    const actualLineHeight = isNaN(lineHeight) ? fontSize * 1.2 : lineHeight

    const estimatedLines = Math.round(height / actualLineHeight)
    setHasManyLines(estimatedLines >= 5)
  }, deps)

  return { hasManyLines, ref }
}

/**
 * Hook version that returns both the ref and the boolean value
 */
export function useLineCount(deps: unknown[] = []): {
  hasManyLines: boolean | null
  ref: React.RefObject<HTMLDivElement>
} {
  return useHasManyLines(deps)
}

// Re-export as default for the main hook
export default useLineCount
