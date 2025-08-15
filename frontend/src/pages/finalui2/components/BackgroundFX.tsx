import React, { useEffect, useRef } from 'react'

/**
 * BackgroundFX
 * Ultra-lightweight, GPU-accelerated background effects for the AI layout.
 * Dark/blue/wavey/tech/neon theme. Zero layout thrash; respects reduced motion.
 */
export const BackgroundFX: React.FC<{
  enableSpotlight?: boolean
  quality?: 'high' | 'balanced' | 'performance'
  enableGrid?: boolean
  enableWaves?: boolean
  enableOrbs?: boolean
  enableNoise?: boolean
}> = ({
  enableSpotlight = true,
  quality = 'balanced',
  enableGrid = true,
  enableWaves = true,
  enableOrbs = true,
  enableNoise = true,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enableSpotlight) return
    const el = rootRef.current
    if (!el) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    let rafId = 0
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      targetX = (e.clientX - rect.left) / rect.width
      targetY = (e.clientY - rect.top) / rect.height
      if (!rafId) tick()
    }

    const tick = () => {
      curX += (targetX - curX) * 0.15
      curY += (targetY - curY) * 0.15
      el.style.setProperty('--spot-x', `${curX}`)
      el.style.setProperty('--spot-y', `${curY}`)
      rafId = Math.abs(targetX - curX) + Math.abs(targetY - curY) > 0.001 ? requestAnimationFrame(tick) : 0
    }

    el.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [enableSpotlight])

  return (
    <div
      ref={rootRef}
      className="ai-fx-root"
      aria-hidden
      data-quality={quality}
    >
      {/* Gradient wash */}
      <div className="ai-fx ai-fx-gradient" />
      {/* Animated tech grid */}
      {enableGrid && <div className="ai-fx ai-fx-grid" />}
      {/* Subtle wave field */}
      {enableWaves && <div className="ai-fx ai-fx-waves" />}
      {/* Floating neon orbs */}
      {enableOrbs && <div className="ai-fx ai-fx-orb orb-1" />}
      {enableOrbs && <div className="ai-fx ai-fx-orb orb-2" />}
      {enableOrbs && <div className="ai-fx ai-fx-orb orb-3" />}
      {/* Spotlight that follows cursor */}
      {enableSpotlight && <div className="ai-fx ai-fx-spotlight" />}
      {/* Film grain */}
      {enableNoise && <div className="ai-fx ai-fx-noise" />}
    </div>
  )
}

export default BackgroundFX
