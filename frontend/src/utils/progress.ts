export function extractProgress(text: string): number | undefined {
  const percent = text.match(/(\d+)%/)
  if (percent) {
    const val = parseInt(percent[1], 10)
    if (!isNaN(val)) return val
  }
  const page = text.match(/page\s*(\d+)\s*of\s*(\d+)/i)
  if (page) {
    const current = parseInt(page[1], 10)
    const total = parseInt(page[2], 10)
    if (!isNaN(current) && !isNaN(total) && total > 0) {
      return Math.round((current / total) * 100)
    }
  }
  return undefined
}
