// Path: src-frontend/src/components/ui/Dropdown.tsx

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { createPortal } from 'react-dom'

export interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: align === 'right'
          ? rect.right + window.scrollX - 180
          : rect.left + window.scrollX,
      })
    }
    setOpen((v) => !v)
  }

  return (
    <>
      <div ref={triggerRef} onClick={handleToggle} className={clsx('inline-flex', className)}>
        {trigger}
      </div>
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-44 rounded-xl bg-white shadow-card-hover border border-divider py-1 animate-scale-in origin-top-right"
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && i > 0 && <div className="my-1 border-t border-divider" />}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-body-md text-left',
                  'transition-colors duration-100',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  item.danger
                    ? 'text-error hover:bg-red-50'
                    : 'text-on-surface hover:bg-surface-container'
                )}
              >
                {item.icon && <span className="text-on-surface-variant shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
