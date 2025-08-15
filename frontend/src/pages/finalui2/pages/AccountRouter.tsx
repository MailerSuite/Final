import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MailLoader from '@/components/ui/MailLoader'

const ProfilePage = lazy(() => import('./account/ProfilePage'))
const SecurityPage = lazy(() => import('./account/SecurityPage'))
const SessionsPage = lazy(() => import('./account/SessionsPage'))
const ApiKeysPage = lazy(() => import('./account/ApiKeysPage'))
const NotificationsPage = lazy(() => import('./account/NotificationsPage'))
const SubscriptionPage = lazy(() => import('./account/SubscriptionPage'))
const EmailVerifyPage = lazy(() => import('./account/EmailVerifyPage'))

export default function AccountRouter() {
  return (
    <Suspense fallback={<div className="p-10 flex items-center justify-center"><MailLoader icon="paper" size="lg" variant="ring" /></div>}>
      <Routes>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="verify-email" element={<EmailVerifyPage />} />
        <Route path="*" element={<Navigate to="profile" replace />} />
      </Routes>
    </Suspense>
  )
}
