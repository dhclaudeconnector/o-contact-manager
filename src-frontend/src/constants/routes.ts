// Path: src-frontend/src/constants/routes.ts

/**
 * Application route path constants.
 * All routes should be defined here to avoid magic strings throughout the codebase.
 *
 * Usage:
 *   import { ROUTES } from '@/constants/routes'
 *   navigate(ROUTES.contactDetail(id))
 */
export const ROUTES = {
  /** Home — all contacts list */
  home: '/' as const,

  /** New contact form */
  contactNew: '/contacts/new' as const,

  /** Contact detail view */
  contactDetail: (id: string) => `/contacts/${id}` as const,

  /** Contact edit form */
  contactEdit: (id: string) => `/contacts/${id}/edit` as const,

  /** Search page */
  search: '/search' as const,

  /** Category filtered view */
  category: (name: string) => `/category/${encodeURIComponent(name)}` as const,

  /** UserDefined keys listing */
  udKeys: '/ud-keys' as const,

  /** Stats dashboard */
  stats: '/stats' as const,

  /** App settings (API key config) */
  settings: '/settings' as const,
} as const

/**
 * Route pattern strings for React Router <Route path=...>
 */
export const ROUTE_PATTERNS = {
  home: '/',
  contactNew: '/contacts/new',
  contactDetail: '/contacts/:id',
  contactEdit: '/contacts/:id/edit',
  search: '/search',
  category: '/category/:name',
  udKeys: '/ud-keys',
  stats: '/stats',
  settings: '/settings',
} as const