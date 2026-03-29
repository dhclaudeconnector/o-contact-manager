// Path: src-frontend/src/components/ui/Badge.tsx

import { type ReactNode } from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-container text-on-surface-variant',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-error',
  info: 'bg-blue-50 text-blue-700',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-body-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', className, dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' ? 'bg-green-500' :
            variant === 'error' ? 'bg-red-500' :
            variant === 'warning' ? 'bg-yellow-500' :
            variant === 'primary' ? 'bg-primary' :
            'bg-on-surface-variant'
          )}
        />
      )}
      {children}
    </span>
  )
}
