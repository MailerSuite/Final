// Minimal shared config stub so imports like ../../../shared/config resolve
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '/api',
    timeout: 60000,
    retryAttempts: 3,
  },
  debug: !!import.meta.env.DEV,
}

export type AppConfig = typeof config
