import { ReactNode } from 'react'

interface ModalBodyProps {
  children: ReactNode
}

export default function ModalBody({ children }: ModalBodyProps) {
  return <div className="px-6 pb-6 pt-4 space-y-4 overflow-y-auto">{children}</div>
}
