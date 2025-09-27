'use client'

interface BadgeProps {
  children: React.ReactNode
  tone?: 'gray' | 'green' | 'red' | 'yellow' | 'blue'
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'gray' }) => {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
  }

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
