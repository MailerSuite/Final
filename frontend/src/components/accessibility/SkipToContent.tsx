import React from 'react'

export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1000] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground shadow"
    >
      Skip to content
    </a>
  )
}

export default SkipToContent
