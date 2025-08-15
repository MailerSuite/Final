import { ReactNode } from 'react'
import { useAuthInterceptor } from '@/hooks/useAuthInterceptor'

export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInterceptor()
  return <>{children}</>
}
