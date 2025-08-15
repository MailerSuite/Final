import React, { useEffect, useState } from 'react'

export default function OAuthCallbackPage() {
  const [message, setMessage] = useState<string>('Processing OAuth callback...')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')

      if (!code) {
        setMessage('Missing authorization code')
        return
      }

      const expectedState = sessionStorage.getItem('oauth_state')
      if (expectedState && state && expectedState !== state) {
        setMessage('Invalid OAuth state')
        return
      }

      sessionStorage.setItem('oauth_code', code)

      // Notify opener if available
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth_code_received' }, '*')
        }
      } catch {}

      setMessage('Authentication complete. You can close this window.')
      // Close after a short delay to ensure storage/write visibility
      setTimeout(() => window.close(), 500)
    } catch (e) {
      setMessage('OAuth callback error')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}