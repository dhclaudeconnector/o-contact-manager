# Frontend Architecture — O Contact Manager
# Path: src-frontend/FRONTEND_ARCHITECTURE.md

> React 18 + Vite + TypeScript + TailwindCSS  
> PWA-ready, Mobile-first, Google Contacts-inspired UI  
> API: REST → http://localhost:3000

---

## 1. Tech Stack

| Layer | Technology | Lý do |
|-------|-----------|-------|
| Framework | React 18 | Component-based, hooks-first |
| Build | Vite 5 | Fast HMR, ESM native |
| Language | TypeScript 5 | Type safety, IDE support |
| Styling | TailwindCSS 3 | Utility-first, mobile-first |
| State | Zustand | Lightweight, no boilerplate |
| Data Fetching | TanStack Query v5 | Cache, pagination, optimistic updates |
| Routing | React Router v6 | SPA routing |
| Forms | React Hook Form + Zod | Validation, performance |
| Icons | Lucide React | Consistent icon set |
| PWA | Vite PWA Plugin | Service worker, manifest |
| HTTP | Axios | Interceptors, typed responses |
| Notifications | React Hot Toast | UX feedback |
| Virtual List | TanStack Virtual | Performance với 30K contacts |

---

## 2. Cấu trúc thư mục

```
src-frontend/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── icons/                     # App icons (192, 512px)
│   └── sw.js                      # Service worker (auto-gen by vite-pwa)
│
├── src/
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Root component + Router
│   ├── vite-env.d.ts              # Vite type declarations
│   │
│   ├── api/                       # API layer (pure functions)
│   │   ├── client.ts              # Axios instance + interceptors
│   │   ├── contacts.api.ts        # /contacts CRUD endpoints
│   │   ├── lookup.api.ts          # /by-email, /by-ud-key, /ud-keys
│   │   ├── bulk.api.ts            # /bulk/import, /bulk/export
│   │   ├── meta.api.ts            # /meta/stats
│   │   └── types.ts               # API request/response types
│   │
│   ├── types/                     # Domain types (shared)
│   │   ├── contact.types.ts       # Contact, ContactIndex, ContactDetail
│   │   ├── pagination.types.ts    # PaginationMeta, CursorPage
│   │   └── common.types.ts        # ApiResponse, ErrorResponse
│   │
│   ├── store/                     # Zustand global state
│   │   ├── auth.store.ts          # API key, auth status
│   │   ├── ui.store.ts            # Sidebar, modal, view mode
│   │   └── filter.store.ts        # Active filters, search query
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useContacts.ts         # TanStack Query: list contacts
│   │   ├── useContact.ts          # TanStack Query: single contact
│   │   ├── useContactMutations.ts # create/update/delete mutations
│   │   ├── useBulkImport.ts       # Bulk import + job polling
│   │   ├── useStats.ts            # Meta stats
│   │   ├── useUdKeys.ts           # UserDefined keys list
│   │   ├── useInfiniteContacts.ts # Infinite scroll pagination
│   │   └── useDebounce.ts         # Debounce search input
│   │
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # Base UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   │
│   │   ├── layout/                # App shell
│   │   │   ├── AppShell.tsx       # Root layout (sidebar + content)
│   │   │   ├── Sidebar.tsx        # Left nav: groups, categories
│   │   │   ├── TopBar.tsx         # Search bar, action buttons
│   │   │   ├── BottomNav.tsx      # Mobile bottom navigation
│   │   │   └── FloatingActionButton.tsx
│   │   │
│   │   ├── contact/               # Contact-specific components
│   │   │   ├── ContactList.tsx    # Virtualized list (A-Z grouped)
│   │   │   ├── ContactListItem.tsx # Single row in list
│   │   │   ├── ContactCard.tsx    # Detail view card
│   │   │   ├── ContactAvatar.tsx  # Avatar with initials fallback
│   │   │   ├── ContactForm.tsx    # Create/Edit form
│   │   │   ├── ContactFormFields.tsx # Email/Phone/UD field arrays
│   │   │   ├── ContactDetail.tsx  # Full detail panel/page
│   │   │   └── ContactActions.tsx # Edit/Delete/Share actions
│   │   │
│   │   ├── search/                # Search & filter components
│   │   │   ├── SearchBar.tsx      # Global search input
│   │   │   ├── FilterChips.tsx    # Active filter chips
│   │   │   ├── FilterDrawer.tsx   # Advanced filter panel
│   │   │   └── SearchResults.tsx  # Search result list
│   │   │
│   │   └── bulk/                  # Bulk operations
│   │       ├── ImportButton.tsx   # Trigger import
│   │       ├── ImportProgress.tsx # Job progress indicator
│   │       └── ExportButton.tsx   # Trigger export
│   │
│   ├── pages/                     # Route-level page components
│   │   ├── ContactsPage.tsx       # / → list all contacts
│   │   ├── ContactDetailPage.tsx  # /contacts/:id
│   │   ├── NewContactPage.tsx     # /contacts/new
│   │   ├── EditContactPage.tsx    # /contacts/:id/edit
│   │   ├── SearchPage.tsx         # /search?q=...
│   │   ├── CategoryPage.tsx       # /category/:name
│   │   ├── UdKeysPage.tsx         # /ud-keys
│   │   ├── SettingsPage.tsx       # /settings (API key config)
│   │   └── StatsPage.tsx          # /stats
│   │
│   ├── utils/                     # Pure utility functions
│   │   ├── format.ts              # Name, phone, date formatters
│   │   ├── avatar.ts              # Generate initials, colors
│   │   ├── groupContacts.ts       # Group contacts A-Z
│   │   ├── validators.ts          # Email, phone validation
│   │   └── storage.ts             # localStorage API key
│   │
│   └── constants/                 # App-wide constants
│       ├── routes.ts              # Route path constants
│       ├── queryKeys.ts           # TanStack Query key factories
│       └── config.ts              # API base URL, defaults
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
└── package.json
```

---

## 3. Data Flow

```
User Action
    │
    ▼
Page/Component
    │ calls
    ▼
Custom Hook (useContacts, useContact...)
    │ uses
    ▼
TanStack Query (cache + loading states)
    │ calls
    ▼
API Function (contacts.api.ts)
    │ uses
    ▼
Axios Client (client.ts) ← API Key from auth.store
    │
    ▼
REST API (localhost:3000)
```

---

## 4. State Management

### Zustand Stores
- **auth.store**: `{ apiKey, setApiKey, clearApiKey }` — persisted to localStorage
- **ui.store**: `{ sidebarOpen, viewMode ('list'|'grid'), selectedIds }` — ephemeral
- **filter.store**: `{ search, category, domain, udKey, hasUD }` — synced with URL params

### TanStack Query
- Contacts list: `['contacts', filters]` → infinite scroll
- Contact detail: `['contacts', id]`
- Stats: `['stats']`
- UD Keys: `['udKeys']`
- Import job: `['importJob', jobId]` → poll every 2s while running

---

## 5. PWA Features

- Installable (Add to Home Screen)
- Offline cache: contact list + static assets
- Background sync: nếu tạo contact offline → sync khi có mạng
- App manifest: name, icons, theme color, display: standalone

---

## 6. Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| mobile (<768px) | Single panel, BottomNav |
| tablet (768-1024px) | Two-panel (list + detail) |
| desktop (>1024px) | Three-panel (sidebar + list + detail) |

---

## 7. Google Contacts Feature Parity

| Feature | Component | Status |
|---------|-----------|--------|
| A-Z grouped list | ContactList | TASK-FE-04 |
| Search (prefix) | SearchBar | TASK-FE-05 |
| Filter by category | FilterDrawer | TASK-FE-06 |
| Contact detail view | ContactDetail | TASK-FE-08 |
| Create contact | NewContactPage | TASK-FE-09 |
| Edit contact | EditContactPage | TASK-FE-09 |
| Delete contact | ContactActions | TASK-FE-10 |
| Multiple emails/phones | ContactFormFields | TASK-FE-09 |
| UserDefined fields | ContactFormFields | TASK-FE-09 |
| Import VCF | ImportButton | TASK-FE-11 |
| Export VCF/JSON | ExportButton | TASK-FE-11 |
| Lookup by email | SearchPage | TASK-FE-05 |
| Categories/Groups | CategoryPage | TASK-FE-07 |
| Stats dashboard | StatsPage | TASK-FE-12 |
| PWA install | vite-pwa | TASK-FE-13 |
| Offline support | Service Worker | TASK-FE-13 |
