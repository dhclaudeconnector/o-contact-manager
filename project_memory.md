# Project Memory — Self-hosted Contact Manager

> Cập nhật: 2026-03-28 10:00 | Task hoàn thành gần nhất: TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
> Agent đọc file này để nắm toàn bộ context và tiếp tục làm việc

---

## Tổng quan project

**Tên project:** contacts-selfhost  
**Mục đích:** Quản lý danh bạ cá nhân self-hosted với ~30,000 contacts  
**Tech stack:**
- Backend: Firebase Firestore + Realtime Database
- API Layer: Express.js + Firebase Admin SDK (standalone Node.js hoặc Cloud Functions)
- Auth: API Key (SHA-256 hash lưu trong Realtime Database)
- Language: Node.js (CommonJS, `'use strict'`)

**Tài liệu gốc:** `docs/database-architecture.md` — đây là spec chính, mọi implementation phải tuân theo

---

## Kiến trúc Database (tóm tắt)

### Firestore Collections (6 collections)
| Collection | Mục đích | Kích thước |
|------------|----------|------------|
| `contacts_index/{id}` | Hiển thị danh sách, search, filter | ~1KB/doc × 30K |
| `contacts_detail/{id}` | Dữ liệu đầy đủ, đọc khi click vào 1 contact | ~5-50KB/doc |
| `email_lookup/{emailId}` | Reverse lookup email → contactId (O1) | ~54K docs |
| `ud_key_lookup/{keyId}` | Reverse lookup userDefined key → contactIds | ~10-30 docs |
| `categories/{id}` | Tag management | ~50 docs |
| `meta/stats` | Thống kê tổng | 1 doc |

### Realtime Database
- `/api_keys/{keyHash}` — API key management (SHA-256 hash, không lưu key gốc)
- `/sync_status` — trạng thái sync
- `/import_jobs/{jobId}` — bulk import progress

### Encoding rule cho document IDs của lookup collections
- Dấu `.` thay bằng `,`
- Ví dụ: `"gitea.token"` → doc ID: `"gitea,token"`
- Ví dụ: `"ongtrieuhau@gmail.com"` → doc ID: `"ongtrieuhau@gmail,com"`

---

## Trạng thái tasks

### Đã hoàn thành
- TASK-01: Firebase Admin SDK init ✅
- TASK-02: Dependencies & project structure ✅
- TASK-03: Firestore Security Rules & Indexes ✅
- TASK-04: `contactMapper.js` + `searchTokens.js` ✅
- TASK-05: `writeContact.js` ✅
- TASK-06: `pagination.js` ✅
- TASK-07: `routes/contacts.js` ✅
- TASK-08: `routes/lookup.js` ✅
- TASK-09: `routes/bulk.js` + `routes/meta.js` ✅
- TASK-10: `middleware/auth.js` + `scripts/create-api-key.js` ✅
- TASK-11: `functions/index.js` ✅

### Chưa thực hiện
- TASK-12: `scripts/vcf2json.js` ← **Tiếp theo (Đợt 5)**
- TASK-13: `scripts/import.js` ← **Tiếp theo (Đợt 5, sau TASK-12)**
- TASK-14: `scripts/migrate-v2.js` ← **Tiếp theo (Đợt 5)**
- TASK-15: Tests & API docs
- TASK-16: Deploy production

**Task tiếp theo nên làm:** TASK-12 (vcf2json — standalone, không phụ thuộc gì), TASK-14 (migrate — chỉ cần TASK-01)

---

## Cấu trúc file hiện tại

```
contacts-selfhost/
├── functions/
│   ├── index.js                          ✅ [TASK-11] Express entry point
│   ├── routes/
│   │   ├── contacts.js                   ✅ [TASK-07] CRUD endpoints
│   │   ├── lookup.js                     ✅ [TASK-08] by-email, by-ud-key, ud-keys
│   │   ├── bulk.js                       ✅ [TASK-09] import, export
│   │   └── meta.js                       ✅ [TASK-09] stats
│   ├── middleware/
│   │   └── auth.js                       ✅ [TASK-10] Bearer token auth
│   └── utils/
│       ├── firebase-admin.js             ✅ [TASK-01] Firebase singleton init
│       ├── searchTokens.js               ✅ [TASK-04] normalize, buildSearchTokens
│       ├── contactMapper.js              ✅ [TASK-04] buildContactDocs, encodeDocId
│       ├── writeContact.js               ✅ [TASK-05] writeContact, deleteContact
│       └── pagination.js                 ✅ [TASK-06] parseQueryParams, paginateQuery
│
├── scripts/
│   └── create-api-key.js                 ✅ [TASK-10] CLI: create, list, revoke
│
├── tests/
│   └── contactMapper.test.js             ✅ [TASK-04] 35 unit tests
│
├── docs/                                 (trống — TASK-15)
├── firestore.rules                       ✅ [TASK-03]
├── firestore.indexes.json                ✅ [TASK-03]
├── database.rules.json                   ✅ [TASK-03]
├── firebase.json                         ✅ [TASK-01]
├── package.json                          ✅ [TASK-02]
├── .env.example                          ✅ [TASK-01]
└── .gitignore                            ✅ [TASK-02]
```

---

## API Endpoints (đã implement)

### Public
- `GET /health` — health check, no auth required

### Protected (Authorization: Bearer \<key\>)
| Method | Path | Handler | Reads/Writes |
|--------|------|---------|--------------|
| GET | `/contacts` | paginateQuery | 50/page |
| GET | `/contacts/:id` | index + detail | 2 reads |
| POST | `/contacts` | writeContact | 2+N writes |
| PUT | `/contacts/:id` | writeContact (isUpdate) | 2+N writes |
| PATCH | `/contacts/:id` | merge + writeContact | 4+N reads+writes |
| DELETE | `/contacts/:id` | deleteContact | 2+N writes |
| GET | `/contacts/by-email/:email` | email_lookup | 3 reads |
| GET | `/contacts/by-ud-key/:key` | ud_key_lookup | 1+N reads |
| GET | `/contacts/ud-keys` | scan ud_key_lookup | ~10-30 reads |
| POST | `/contacts/bulk/import` | async job | 202 + background |
| GET | `/contacts/bulk/import/:jobId` | RTDB read | 1 read |
| GET | `/contacts/bulk/export` | full scan | N reads |
| GET | `/contacts/meta/stats` | meta/stats | 1 read |

### Route mount order (quan trọng!)
```
lookupRouter   → /contacts  (by-email, by-ud-key, ud-keys)
bulkRouter     → /contacts/bulk
metaRouter     → /contacts/meta
contactsRouter → /contacts  (/:id phải sau cùng)
```

---

## Quyết định kỹ thuật đã chốt

1. **Atomic batch write:** Mỗi contact write = 1 Firestore batch (index + detail + email_lookup + ud_key_lookup)
2. **Search tokens:** Prefix ngrams từ ký tự thứ 2 trở đi, NFD normalize để hỗ trợ tiếng Việt
3. **Email encoding:** lowercase trước khi lưu
4. **Pagination:** Cursor-based (base64url encode docId, startAfter snapshot)
5. **API Key:** SHA-256 hex hash, format `cm_<64hex>`, lưu hash trong RTDB (không lưu key gốc)
6. **Auth flow:** lastUsedAt cập nhật async non-blocking (`.catch(() => {})`)
7. **PATCH merge:** Existing detail + patch body; userDefined key = null → xóa key đó
8. **Bulk import:** `setImmediate` để trả response trước, background process sau
9. **CommonJS (`require`):** Toàn bộ project dùng `'use strict'` + CommonJS
10. **`nanoid@^3`:** Dùng v3 (CommonJS) — v4+ chỉ có ESM
11. **Filter priority trong buildQuery:** search > email > udKey > category > domain
12. **Route conflict:** lookup/bulk/meta mount trước contacts để `/:id` không bắt hết

---

## API của các modules đã implement

### auth middleware
```js
const { authMiddleware, hashKey } = require('./middleware/auth');
// req.apiKey = { hash, name, active, createdAt, lastUsedAt, ... }
```

### routes/contacts.js
```
GET    /contacts?search=&category=&domain=&email=&udKey=&hasUD=&sort=&order=&limit=&cursor=
GET    /contacts/:id?detail=false
POST   /contacts   body: contactJson
PUT    /contacts/:id   body: contactJson
PATCH  /contacts/:id   body: { contact?: {...}, userDefined?: {...} }
DELETE /contacts/:id
```

### routes/lookup.js
```
GET /contacts/by-email/:email?detail=false
GET /contacts/by-ud-key/:key?detail=true
GET /contacts/ud-keys?sort=count|key&order=desc&search=prefix
```

### routes/bulk.js
```
POST /contacts/bulk/import   body: { contacts: [...] }  → { jobId, total, status }
GET  /contacts/bulk/import/:jobId                        → job data
GET  /contacts/bulk/export?format=json|summary&category=&limit=&includeDetail=true
```

### routes/meta.js
```
GET /contacts/meta/stats?refresh=true
```

---

## Cấu hình cần thiết khi setup

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
PORT=3000
NODE_ENV=development
```

---

## Ghi chú quan trọng cho agent

- **Server chạy:** `npm run dev` (nodemon) hoặc `npm start`
- **Tạo API key:** `node scripts/create-api-key.js --name "My App"`
- **TASK-12 (vcf2json) không phụ thuộc gì** — có thể làm độc lập ngay
- **TASK-13 (import script) cần TASK-12 xong trước**
- **TASK-14 (migrate) chỉ cần firebase-admin** — có thể làm song song với TASK-12
- **Firestore chỉ cho 1 `array-contains` per query** — xem filter priority
- **Batch limit = 500 ops** — migrate script dùng 400 docs/batch an toàn
- **`ud_key_lookup.count` có thể lệch** — dùng `contactIds.length` thực tế trong response
