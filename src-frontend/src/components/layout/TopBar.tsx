// Path: src-frontend/src/components/layout/TopBar.tsx

import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { useUIStore } from '@/store/ui.store'
import { Dropdown } from '@/components/ui/Dropdown'
import type { DropdownItem } from '@/components/ui/Dropdown'

interface TopBarProps {
  title?: string
  showBack?: boolean
  actions?: React.ReactNode
  className?: string
}

export function TopBar({ title, showBack, actions, className }: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const viewMode = useUIStore((s) => s.viewMode)
  const setViewMode = useUIStore((s) => s.setViewMode)

  const isHome = location.pathname === '/'

  const viewItems: DropdownItem[] = [
    {
      label: 'Dạng danh sách',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round"/>
          <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round"/>
          <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round"/>
          <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" strokeWidth="2.5"/>
          <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth="2.5"/>
          <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth="2.5"/>
        </svg>
      ),
      onClick: () => setViewMode('list'),
    },
    {
      label: 'Dạng lưới',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
      onClick: () => setViewMode('grid'),
    },
  ]

  return (
    <header className={clsx('flex items-center gap-2 px-4 py-3 border-b border-divider bg-white shrink-0', className)}>
      {/* Left: hamburger or back */}
      {showBack ? (
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Quay lại"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ) : (
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
            <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Title */}
      {title && (
        <h1 className="text-title-md text-on-surface font-medium flex-1 truncate">{title}</h1>
      )}

      {/* Custom actions */}
      {actions}

      {/* View toggle (home only) */}
      {isHome && (
        <Dropdown
          trigger={
            <button
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Chọn kiểu hiển thị"
            >
              {viewMode === 'list' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round"/>
                  <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round"/>
                  <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round"/>
                  <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" strokeWidth="2.5"/>
                  <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth="2.5"/>
                  <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth="2.5"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              )}
            </button>
          }
          items={viewItems}
        />
      )}
    </header>
  )
}
