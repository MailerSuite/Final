export function parseEmailList(text: string): string[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const emails: string[] = []
  const header = lines[0].toLowerCase()
  if (header.includes('email')) {
    for (const line of lines.slice(1)) {
      const email = line.split(/[,;\s]/)[0].trim()
      if (email) emails.push(email)
    }
  } else {
    for (const line of lines) {
      line.split(/[,;\s]/).forEach((part) => {
        const email = part.trim()
        if (email) emails.push(email)
      })
    }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emails.filter((e) => emailRegex.test(e))
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function chunkList<T>(list: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}
