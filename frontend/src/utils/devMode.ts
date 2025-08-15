// Development mode utilities
export const DEV_MODE = {
  // Bypass authentication for development
  BYPASS_AUTH: true,
  
  // Mock user data for development
  MOCK_USER: {
    id: "1",
    email: "dev@mailersuite.com",
    username: "developer", 
    name: "Developer",
    is_admin: true,
    is_active: true,
    created_at: new Date().toISOString(),
  }
}

// Helper to check if we're in dev mode with auth bypass
export const isAuthBypassed = () => {
  // Allow explicit flag to force bypass in any mode
  const flagBypass = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'
  return (import.meta.env.DEV && DEV_MODE.BYPASS_AUTH) || flagBypass
}

// Helper to get mock user data
export const getMockUser = () => {
  return DEV_MODE.MOCK_USER
}