export function getSessionId(): string | null {
  try {
    const raw = localStorage.getItem('session-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const id = parsed?.state?.session?.id
    if (id === undefined || id === null) return null
    return String(id)
  } catch {
    return null
  }
}
