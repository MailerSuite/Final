import React from 'react'

export default function TopProgressBar({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed left-0 right-0 top-0 z-[1100] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 120ms ease' }}
    >
      <div className="relative w-full h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400" />
      </div>
    </div>
  )
}
