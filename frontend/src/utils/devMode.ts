// Development mode utilities
export const DEV_MODE = {
  // Bypass authentication for development
  BYPASS_AUTH: true,
  
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
export const isAuthBypassed = () => {
  return process.env.NODE_ENV === 'development' && DEV_MODE.BYPASS_AUTH
}

// Helper to get mock user data
export const getMockUser = () => {
  return DEV_MODE.MOCK_USER
}