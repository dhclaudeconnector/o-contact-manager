// Path: src-frontend/src/types/pagination.types.ts

import type { ContactIndex } from './contact.types'

/**
 * Pagination metadata returned by list endpoints
 */
export interface PaginationMeta {
  /** Number of items in current page */
  count: number
  /** Requested page limit */
  limit: number
  /** Whether there are more pages */
  hasMore: boolean
  /** Cursor for next page (base64url encoded docId), null if no more pages */
  nextCursor: string | null
  /** Active sort field */
  sort: 'updatedAt' | 'createdAt' | 'displayName'
  /** Sort direction */
  order: 'asc' | 'desc'
}

/**
 * A page of contacts returned by GET /contacts
 */
export interface ContactsPage {
  data: ContactIndex[]
  meta: PaginationMeta
}

/**
 * Filter params for GET /contacts
 * Maps directly to query string params
 */
export interface ContactsFilterParams {
  /** Prefix search: min 2 chars */
  search?: string
  /** Filter by category name */
  category?: string
  /** Filter by email domain e.g. 'gmail.com' */
  domain?: string
  /** Filter by exact email address */
  email?: string
  /** Filter by userDefined key name */
  udKey?: string
  /** Filter by hasUserDefined flag */
  hasUD?: boolean
  /** Sort field */
  sort?: 'updatedAt' | 'createdAt' | 'displayName'
  /** Sort direction */
  order?: 'asc' | 'desc'
  /** Max items per page (default 50, max 200) */
  limit?: number
  /** Pagination cursor from previous page's meta.nextCursor */
  cursor?: string
}