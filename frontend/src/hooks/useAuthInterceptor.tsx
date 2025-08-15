import { useEffect, useRef } from 'react'
// Deprecated: unified client handles auth globally
import { useAuthStore } from '@/store/auth'
import { showError } from '@/components/feedback/ToastManager'
import { useNavigate } from 'react-router-dom'

export function useAuthInterceptor() {
  const attached = useRef(false)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    // 🚫 DISABLED: This interceptor conflicts with main auth system
    // Using only the unified auth system in axios.ts to prevent conflicts
    console.log('🚫 useAuthInterceptor: DISABLED - using unified auth system instead')
    
    /* DISABLED TO PREVENT AUTH CONFLICTS - MULTIPLE INTERCEPTORS CAUSE LOGOUT ISSUES
    if (attached.current) return
    attached.current = true

    const id = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        // Auth logic moved to unified system in axios.ts
      },
    )

    return () => {
      axios.interceptors.response.eject(id)
      attached.current = false
    }
    */
    
    // Return cleanup function (no-op)
    return () => {}
  }, [logout, navigate])
}
