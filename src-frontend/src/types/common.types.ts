// Path: src-frontend/src/types/common.types.ts

/**
 * Generic API success response wrapper
 */
export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

/**
 * API error response from backend
 */
export interface ApiError {
  error: string
  message: string
  requestId?: string
}

/**
 * View mode for contact list
 */
export type ViewMode = 'list' | 'grid'

/**
 * Active panel in desktop two/three-panel layout
 */
export type ActivePanel = 'list' | 'detail' | 'form'

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

/**
 * Generic loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'