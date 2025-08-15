import React, { useEffect, useState } from "react"

interface ProgressBarProps {
  /**
   * Progress percentage from 0 to 100. If undefined, the bar is indeterminate.
   */
  progress?: number
  /**
   * When true, the bar is visible and animating. Should be set when a task is active.
   */
  active?: boolean
  /** Optional callback when the bar finishes */
  onComplete?: () => void
}

export default function ProgressBar({
  progress,
  active = false,
  onComplete,
}: ProgressBarProps) {
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (active) setVisible(true)
  }, [active])

  useEffect(() => {
    if (progress !== undefined && progress >= 100) {
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [progress, onComplete])

  if (!visible) return null

  const determinate = progress !== undefined

  return (
    <div
      className="w-full h-1 relative overflow-hidden bg-primary/20 rounded-t-md"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determinate ? Math.min(progress ?? 0, 100) : undefined}
      aria-label="Progress"
    >
      {determinate ? (
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
        />
      ) : (
        <div className="absolute left-0 top-0 h-full w-1/3 bg-primary animate-progress-indeterminate" />
      )}
    </div>
  )
}
