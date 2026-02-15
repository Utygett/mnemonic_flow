export const isMcqType = (t?: string) => {
  const s = (t ?? '').toLowerCase()
  return (
    s === 'mcq' ||
    s.includes('multiple_choice') ||
    s.includes('multiple-choice') ||
    s.includes('choice')
  )
}
