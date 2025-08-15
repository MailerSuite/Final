import React from 'react'
import { AppLayout } from '@/components/layout'

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}

export default MainLayout
