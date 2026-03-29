// Path: src-frontend/src/components/ui/Input.tsx

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefixIcon?: ReactNode
  suffixIcon?: ReactNode
  onClear?: () => void
  clearable?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      prefixIcon,
      suffixIcon,
      onClear,
      clearable = false,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const showClear = clearable && value && String(value).length > 0

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-label text-on-surface font-medium">
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <span className="absolute left-3 text-on-surface-variant pointer-events-none">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            className={clsx(
              'w-full rounded-lg border bg-white px-3 py-2 text-body-md text-on-surface',
              'placeholder:text-on-surface-variant/60',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container',
              error
                ? 'border-error focus:ring-error/30 focus:border-error'
                : 'border-divider hover:border-on-surface-variant/40',
              prefixIcon ? 'pl-9' : '',
              suffixIcon || showClear ? 'pr-9' : '',
              className
            )}
            {...props}
          />
          {showClear && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
              aria-label="Clear input"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {suffixIcon && !showClear && (
            <span className="absolute right-3 text-on-surface-variant pointer-events-none">
              {suffixIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-body-sm text-error flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-body-sm text-on-surface-variant">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
