import { useEffect, useState } from 'react'
import { CallBackProps, EVENTS, STATUS } from 'react-joyride'

export const TOUR_STORAGE_KEY = 'hasSeenTour'

export function useTour() {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!seen) {
      setRun(true)
    }
  }, [])

  const handleCallback = (data: CallBackProps) => {
    const { status, type } = data
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex((i) => i + 1)
    }
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setRun(false)
    }
  }

  const start = () => setRun(true)

  return { run, stepIndex, setStepIndex, handleCallback, start }
}
