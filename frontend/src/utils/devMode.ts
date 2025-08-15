// Development mode utilities

// Determine if dev mode is enabled via Vite flags
export const isDevMode = Boolean(import.meta.env.VITE_DEV_MODE ?? import.meta.env.DEV)

export const DEV_MODE = {
  // Bypass authentication only when dev mode is enabled
  BYPASS_AUTH: Boolean((import.meta.env.VITE_BYPASS_AUTH ?? true) && isDevMode),

  // Mock user data for development
  MOCK_USER: {
    id: 1,
    email: "dev@mailersuite.com",
    username: "developer",
    name: "Developer",
    is_admin: true
  }
}

// Helper to check if we're in dev mode with auth bypass
export const isAuthBypassed = () => DEV_MODE.BYPASS_AUTH

// Helper to get mock user data
export const getMockUser = () => DEV_MODE.MOCK_USER