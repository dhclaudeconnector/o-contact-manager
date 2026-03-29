// Path: src-frontend/src/store/filter.store.ts

import { create } from 'zustand'
import type { ContactsFilterParams } from '@/types/pagination.types'

type SortField = 'updatedAt' | 'createdAt' | 'displayName'
type SortOrder = 'asc' | 'desc'

interface FilterState {
  search: string
  category: string | null
  domain: string | null
  email: string | null
  udKey: string | null
  hasUD: boolean | null
  sort: SortField
  order: SortOrder
  setSearch: (q: string) => void
  setCategory: (c: string | null) => void
  setDomain: (d: string | null) => void
  setEmail: (e: string | null) => void
  setUdKey: (k: string | null) => void
  setHasUD: (v: boolean | null) => void
  setSort: (sort: SortField, order: SortOrder) => void
  setFilter: <K extends keyof Omit<FilterState, 'setSearch' | 'setCategory' | 'setDomain' | 'setEmail' | 'setUdKey' | 'setHasUD' | 'setSort' | 'setFilter' | 'resetFilters' | 'hasActiveFilters' | 'toApiParams'>>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  hasActiveFilters: () => boolean
  toApiParams: () => ContactsFilterParams
}

const defaultState = {
  search: '',
  category: null,
  domain: null,
  email: null,
  udKey: null,
  hasUD: null,
  sort: 'updatedAt' as SortField,
  order: 'desc' as SortOrder,
}

export const useFilterStore = create<FilterState>()((set, get) => ({
  ...defaultState,

  setSearch: (q) => set({ search: q }),
  setCategory: (c) => set({ category: c }),
  setDomain: (d) => set({ domain: d }),
  setEmail: (e) => set({ email: e }),
  setUdKey: (k) => set({ udKey: k }),
  setHasUD: (v) => set({ hasUD: v }),
  setSort: (sort, order) => set({ sort, order }),

  setFilter: (key, value) => set({ [key]: value } as Partial<FilterState>),

  resetFilters: () => set(defaultState),

  hasActiveFilters: () => {
    const { search, category, domain, email, udKey, hasUD } = get()
    return !!(search || category || domain || email || udKey || hasUD !== null)
  },

  toApiParams: (): ContactsFilterParams => {
    const { search, category, domain, email, udKey, hasUD, sort, order } = get()
    const params: ContactsFilterParams = { sort, order }
    if (search) params.search = search
    if (category) params.category = category
    if (domain) params.domain = domain
    if (email) params.email = email
    if (udKey) params.udKey = udKey
    if (hasUD !== null) params.hasUD = hasUD
    return params
  },
}))
