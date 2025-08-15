import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export default function SectionCard({ title, subtitle, children, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-lg bg-gradient-to-b from-brand-red-900 via-brand-red-800 to-brand-red-900/90 p-8',
        className
      )}
    >
      <header>
        <h2 className="text-white text-xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-brand-gray-300 text-sm">{subtitle}</p>}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  )
}
