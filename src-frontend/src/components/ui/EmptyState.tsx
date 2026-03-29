// Path: src-frontend/src/components/ui/EmptyState.tsx

import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-16 px-6 text-center', className)}>
      {icon && (
        <div className="text-on-surface-variant/40 mb-1">{icon}</div>
      )}
      <h3 className="text-title-md text-on-surface">{title}</h3>
      {description && (
        <p className="text-body-md text-on-surface-variant max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
