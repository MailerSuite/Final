import React from 'react'

interface ProxyStatusBadgeProps {
  isActive?: boolean
  firewallOn?: boolean
  className?: string
}

export default function ProxyStatusBadge({
  isActive,
  firewallOn,
  className,
}: ProxyStatusBadgeProps) {
  return (
    <span className={`flex gap-1 ${className ?? ''}`}>
      {typeof isActive === 'boolean' && (
        <span
          className={`${
            isActive ? 'bg-green-500' : 'bg-red-500'
          } text-white px-2 rounded-full`}
        >
          {isActive ? 'Active' : 'Down'}
        </span>
      )}
      {firewallOn && (
        <span className="bg-red-500 text-white px-2 rounded-full">Firewall On</span>
      )}
    </span>
  )
}
