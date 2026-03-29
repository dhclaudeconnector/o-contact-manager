// Path: src-frontend/src/components/ui/Spinner.tsx

import { clsx } from 'clsx'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  /** Show full-screen overlay */
  overlay?: boolean
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export function Spinner({ size = 'md', className, overlay = false }: SpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-primary" />
          <span className="text-body-sm text-on-surface-variant">Đang tải...</span>
        </div>
      </div>
    )
  }

  return spinner
}
