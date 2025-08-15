// State Migration Helper
// Helps migrate from old Redux/Context patterns to unified Zustand store

import { useUnifiedStore } from './unified-state'

export const migrateExistingState = () => {
  const store = useUnifiedStore.getState()
  
  // Migrate existing auth state if it exists
  const existingToken = localStorage.getItem('token')
  if (existingToken) {
    store.setToken(existingToken)
  }
  
  // Migrate existing user data
  const existingUser = localStorage.getItem('user')
  if (existingUser) {
    try {
      const userData = JSON.parse(existingUser)
      store.setUser(userData)
    } catch (error) {
      console.warn('Failed to migrate user data:', error)
    }
  }
  
  // Clear old storage keys
  localStorage.removeItem('auth-storage')
  localStorage.removeItem('campaign-store')
  
  console.log('State migration completed')
}
