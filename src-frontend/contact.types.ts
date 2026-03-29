// Path: src-frontend/src/types/contact.types.ts

/**
 * Email entry matching backend contacts_detail.contact.emails[] schema
 */
export interface EmailEntry {
  /** Email type tags e.g. ['INTERNET', 'WORK'] */
  type: string[]
  /** Email address (lowercase) */
  value: string
  /** Optional user-readable label */
  label?: string | null
}

/**
 * Phone entry matching backend contacts_detail.contact.phones[] schema
 */
export interface PhoneEntry {
  /** Phone type tags e.g. ['CELL'] or ['VOICE', 'WORK'] */
  type: string[]
  /** Phone number string */
  value: string
}

/**
 * Structured name parts from vCard N property
 */
export interface NameParts {
  family?: string
  given?: string
  middle?: string
  prefix?: string
  suffix?: string
}

/**
 * Address entry from vCard ADR property
 */
export interface AddressEntry {
  type: string[]
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

/**
 * Contact index document — lightweight, used for list/search/filter views
 * Matches Firestore contacts_index/{contactId} schema
 */
export interface ContactIndex {
  id: string
  displayName: string
  nameNormalized: string
  primaryEmail: string
  emailDomain: string
  allEmails: string[]
  allDomains: string[]
  primaryPhone: string
  organization?: string
  photoUrl?: string
  categories: string[]
  tags: string[]
  searchTokens: string[]
  userDefinedKeys: string[]
  hasUserDefined: boolean
  udKeyCount: number
  emailCount: number
  phoneCount: number
  createdAt: string
  updatedAt: string
  importedAt?: string
  sourceFile?: string
  version: number
}

/**
 * Contact detail inner object
 */
export interface ContactDetailInner {
  displayName: string
  name?: NameParts
  emails: EmailEntry[]
  phones: PhoneEntry[]
  addresses?: AddressEntry[]
  organization?: string
  categories: string[]
  note?: string
  birthday?: string
  extensions?: Record<string, string>
}

/**
 * Contact detail document — full data, fetched on-demand
 * Matches Firestore contacts_detail/{contactId} schema
 */
export interface ContactDetail {
  id: string
  contact: ContactDetailInner
  /** userDefined key-value pairs e.g. { 'github.token': 'ghp_...' } */
  userDefined: Record<string, string>
  /** Raw VCF string if imported from vCard */
  vcfRaw?: string
  createdAt: string
  updatedAt: string
  version: number
}

/**
 * Combined type: ContactIndex + detail field
 * Returned by GET /contacts/:id
 */
export interface ContactWithDetail extends ContactIndex {
  detail: ContactDetail | null
}

/**
 * Form data for creating/updating a contact
 * Mirrors ContactDetail structure but with optional fields for partial updates
 */
export interface ContactFormData {
  contact: {
    displayName: string
    name?: NameParts
    emails?: EmailEntry[]
    phones?: PhoneEntry[]
    organization?: string
    categories?: string[]
    note?: string
    birthday?: string
  }
  userDefined?: Record<string, string>
  vcfRaw?: string
}

/**
 * Email lookup result from GET /contacts/by-email/:email
 */
export interface EmailLookupResult {
  contactId: string
  email: string
  isPrimary: boolean
  type: string[]
  label: string | null
  contact: ContactIndex
  detail: ContactDetail | null
}

/**
 * UD key entry from GET /contacts/ud-keys
 */
export interface UdKeyEntry {
  key: string
  count: number
  updatedAt: string | null
}

/**
 * UD key lookup result from GET /contacts/by-ud-key/:key
 */
export interface UdKeyLookupResult {
  data: ContactIndex[]
  meta: {
    key: string
    count: number
    totalInLookup: number
  }
}

/**
 * Stats data from GET /contacts/meta/stats
 */
export interface StatsData {
  totalContacts: number
  totalEmails?: number
  totalWithUserDefined?: number
  lastImportAt: string | null
  lastImportCount: number
  lastImportFile?: string
  migratedAt?: string
}

/**
 * Import job status from Realtime DB (via GET /contacts/bulk/import/:jobId)
 */
export interface ImportJobStatus {
  status: 'running' | 'completed' | 'failed'
  total: number
  done: number
  success: number
  errors: Array<{ index: number; error: string }>
  sourceFile: string | null
  startedAt: string
  finishedAt: string | null
  error?: string // top-level error if status = 'failed'
}

/**
 * Contact write result from POST/PUT/PATCH /contacts
 */
export interface ContactWriteResult {
  contactId: string
  emailCount?: number
  udKeyCount?: number
}

/**
 * Bulk import trigger result
 */
export interface BulkImportResult {
  jobId: string
  statusUrl: string
  total: number
  message: string
}
