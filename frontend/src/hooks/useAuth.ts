import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import {
  loginEmail,
  loginTelegram,
  me,
  type LoginPayload,
} from '@/api/auth'

export default function useAuth() {
  // IMPORTANT: All Zustand store hooks must be called consistently
  const token = useAuthStore(s => s.token)
  const userData = useAuthStore(s => s.userData)
  const setTokens = useAuthStore(s => s.setTokens)
  const setUserData = useAuthStore(s => s.setUserData)
  const logout = useAuthStore(s => s.logout)

  const login = useCallback(
    async (payload: LoginPayload) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 useAuth: Starting login with payload:', { email: 'email' in payload ? payload.email : 'telegram' });
      }
      
      const data =
        'email' in payload
          ? await loginEmail(payload)
          : await loginTelegram(payload)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ useAuth: Login successful, response:', data);
      }
      
      // FIXED: Set tokens first
      setTokens(data.access_token, data.refresh_token)
      
      // FIXED: Use user data from login response immediately to prevent race condition
      let user = data.user
      if (user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 useAuth: Setting user data from login response:', { id: user.id, email: user.email, is_admin: user.is_admin });
        }
        setUserData(user)
      } else {
        // Fallback: fetch user data if not included in login response
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 useAuth: User data not in response, fetching from /me endpoint...');
        }
        user = await me()
        setUserData(user)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 useAuth: Authentication complete, final user:', { id: user.id, email: user.email, is_admin: user.is_admin });
      }
      
      return { ...data, user }
    },
    [setTokens, setUserData],
  )

  // Helper to check if user is admin - simplified to only check is_admin field
  const isAdmin = useCallback(() => {
    return userData?.is_admin === true
  }, [userData])

  // Helper to get dashboard route based on role
  const getDashboardRoute = useCallback(() => {
    return isAdmin() ? '/admin' : '/dashboard'
  }, [isAdmin])

  return {
    token,
    userData,
    login,
    logout,
    isAdmin,
    getDashboardRoute,
  }
}
