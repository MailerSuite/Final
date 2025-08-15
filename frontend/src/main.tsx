import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Provide React on the global object for modules that reference the namespace (e.g., React.useState)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).React = React

import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary'

// Import the App component directly
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
