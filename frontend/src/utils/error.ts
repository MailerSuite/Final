import axios from 'axios'

export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error'

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | string | undefined
    if (typeof data === 'string') return data
    if (data) {
      if (typeof data.message === 'string') return data.message
      if (typeof data.detail === 'string') return data.detail
    }
    if (error.message) return error.message
    return String(error)
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') return error

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
