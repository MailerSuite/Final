import React from 'react'
import { createPortal } from 'react-dom'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import SkeletonAI from './SkeletonAI'
import TopProgressBar from './TopProgressBar'

export default function GlobalLoadingOverlay() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const [visible, setVisible] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  const active = isFetching > 0 || isMutating > 0

  React.useEffect(() => {
    if (active) {
      // delay to avoid flicker on very short requests
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setVisible(true), 200)
    } else {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      setVisible(false)
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [active])

  return createPortal(
    <>
      <TopProgressBar visible={active} />
      {visible && (
        <div className="fixed inset-0 z-[1000] pointer-events-none">
          <SkeletonAI variant="sidebar" />
        </div>
      )}
    </>,
    document.body
  )
}
