## [TASK-07,08,09,10,11] 2026-03-28 10:00 — API Routes, Auth Middleware & Express App

### Thay đổi kỹ thuật

**TASK-07 — routes/contacts.js**
- Tạo mới `functions/routes/contacts.js` — đầy đủ 6 CRUD endpoints:
  - `GET /contacts` — gọi `parseQueryParams` + `paginateQuery` + `buildListResponse`; validate search >= 2 chars
  - `GET /contacts/:id` — đọc song song index + detail (`Promise.all`); support `?detail=false` chỉ lấy index
  - `POST /contacts` — validate có displayName hoặc email; gọi `writeContact`; tăng `meta/stats` async
  - `PUT /contacts/:id` — kiểm tra contact tồn tại; overwrite với `isUpdate: true`
  - `PATCH /contacts/:id` — đọc existing detail; deep merge contact + userDefined (null = xóa key); write lại
  - `DELETE /contacts/:id` — gọi `deleteContact`; giảm `meta/stats` async
  - `updateStats()` helper — non-critical, silent fail nếu lỗi

**TASK-08 — routes/lookup.js**
- Tạo mới `functions/routes/lookup.js`:
  - `GET /contacts/by-email/:email` — decode URI + lowercase; tra `email_lookup/{encodeDocId(email)}`; fetch index + detail song song; trả thêm `matchedEmail` metadata
  - `GET /contacts/by-ud-key/:key` — tra `ud_key_lookup`; fetch N index docs song song; optional `?detail=true` thêm N reads; trả `matchedUdKey.value`
  - `GET /contacts/ud-keys` — scan toàn bộ `ud_key_lookup`; filter bỏ entries rỗng; sort by count|key; support `?search` prefix filter
  - Dùng `contactIds.length` thực tế thay vì `stored count` để tránh inconsistency

**TASK-09 — routes/bulk.js & routes/meta.js**
- Tạo mới `functions/routes/bulk.js`:
  - `POST /contacts/bulk/import` — tạo job RTDB; trả `202 Accepted` ngay; process background qua `setImmediate`; concurrency 5; update progress mỗi 50 contacts; lưu `errorSample` (10 entries); final status: completed|partial|failed
  - `GET /contacts/bulk/import/:jobId` — đọc job status từ RTDB
  - `GET /contacts/bulk/export` — filter optional by category; support `?format=summary` (stats tổng hợp); `?includeDetail=true` (chunk 10 để tránh too many concurrent); gửi header `Content-Disposition` cho download
- Tạo mới `functions/routes/meta.js`:
  - `GET /contacts/meta/stats` — đọc cached (1 read); `?refresh=true` recompute bằng cursor scan toàn bộ contacts_index (500/batch); lưu lại sau recompute

**TASK-10 — middleware/auth.js & scripts/create-api-key.js**
- Tạo mới `functions/middleware/auth.js`:
  - Validate `Authorization: Bearer <key>` header
  - `hashKey(key)` — SHA-256 hex
  - Lookup `/api_keys/{keyHash}` trong Realtime DB
  - Kiểm tra `active === false` → 401 Revoked
  - Kiểm tra `expiresAt` → 401 Expired
  - Attach `req.apiKey = { hash, ...keyData }`
  - Update `lastUsedAt` async (`.catch(() => {})` silent fail)
- Tạo mới `scripts/create-api-key.js`:
  - Format key: `cm_<64 hex chars>` (32 bytes random)
  - `--name <name>` — đặt tên key
  - `--expires <date>` — set expiry date
  - `--list` — liệt kê tất cả keys (hash, name, status, lastUsed)
  - `--revoke <hash>` — set `active: false`

**TASK-11 — functions/index.js**
- Tạo mới `functions/index.js`:
  - CORS + JSON body parser (10MB limit)
  - Request logger (development only)
  - `GET /health` public — trả version, env, timestamp
  - `authMiddleware` áp dụng cho `/contacts/*`
  - Mount order: `lookupRouter` → `bulkRouter` → `metaRouter` → `contactsRouter` (tránh `/:id` bắt hết)
  - 404 handler + global error handler (JSON parse error, payload too large, production message sanitization)
  - `app.listen(PORT)` với startup log

### Lý do
- TASK-07-09: Core API — đây là giao diện chính mà user sẽ tương tác
- TASK-10: Bảo vệ tất cả endpoints; hash key để không lộ key gốc ngay cả khi RTDB bị compromise
- TASK-11: Entry point — kết nối tất cả components lại; mount order quan trọng để tránh route conflict

---

## [TASK-04,05,06] 2026-03-28 — Core Utilities: contactMapper, writeContact, pagination

### Thay đổi kỹ thuật

**TASK-04 — contactMapper.js + searchTokens.js**
- Tạo mới `functions/utils/searchTokens.js`:
  - `normalize(str)` — lowercase + NFD strip diacritics (hỗ trợ tiếng Việt: ễ, ă, ơ, ...)
  - `tokensFromText(text)` — prefix ngrams từ min 2 chars, bỏ 1-char
  - `buildSearchTokens({displayName, organization, primaryEmail, allEmails})` — dedup + sorted
- Tạo mới `functions/utils/contactMapper.js`:
  - `buildContactDocs(contactJson, options)` — transform về `{contactId, indexDoc, detailDoc, emailLookupDocs, udKeyUpdates}`
  - Hỗ trợ 2 input format: wrapped `{contact:{...}, userDefined:{...}}` và flat `{displayName, emails, ...}`
  - `encodeDocId(key)` — encode `.` → `,` cho Firestore document IDs
  - `extractEmails()`, `extractPhones()`, `extractDisplayName()`, `extractUdKeys()` — các helper extract fields
  - allEmails: dedup + lowercase; allDomains: extract domain từ mỗi email
  - Auto-generate contactId bằng `nanoid(12)` nếu không truyền
- Tạo mới `tests/contactMapper.test.js` — 35 unit tests, 100% pass

**TASK-05 — writeContact.js**
- Tạo mới `functions/utils/writeContact.js`:
  - `writeContact(contactJson, options)` — 1 Firestore batch: set index, set detail, delete cũ email_lookup, set mới email_lookup, arrayRemove cũ ud_key_lookup, arrayUnion mới ud_key_lookup
  - `deleteContact(contactId)` — đọc index → batch delete index + detail + email_lookups + arrayRemove ud_key_lookups
  - `bulkWriteContacts(array, {concurrency, onProgress})` — Promise.allSettled với chunk size 5
  - isUpdate=true: đọc allEmails + userDefinedKeys cũ để cleanup diff trước khi write
  - FieldValue.increment(-1/+1) trên ud_key_lookup.count

**TASK-06 — pagination.js**
- Tạo mới `functions/utils/pagination.js`:
  - `encodeCursor(docId)` / `decodeCursor(cursor)` — base64url
  - `parseQueryParams(req.query)` — validate + normalize: search, category, domain, email, udKey, hasUD, sort, order, limit (max 200), cursor
  - `buildQuery(params)` — Firestore query builder với ưu tiên filter: search > email > udKey > category > domain; support combo category+udKey
  - `paginateQuery(params)` — fetch limit+1, startAfter snapshot, trả `{data, nextCursor, hasMore, count}`
  - `buildListResponse()` — format response chuẩn với meta object

### Lý do
- TASK-04: Prerequisite cho mọi thứ — import script, write operations, API routes đều dùng contactMapper
- TASK-05: Đảm bảo 4 collections luôn consistent — không bao giờ write 1 collection mà thiếu collection kia
- TASK-06: Cursor pagination giải quyết vấn đề quota — offset-based là O(n) reads với Firestore

---

## [TASK-01,02,03] 2026-03-28 — Khởi tạo Firebase, Dependencies & Security Rules

### Thay đổi kỹ thuật

**TASK-01 — Firebase Admin SDK init**
- Tạo mới `functions/utils/firebase-admin.js` — singleton pattern, lazy init
- Tạo mới `firebase.json` — cấu hình Firestore rules/indexes, Realtime DB rules, Functions runtime nodejs18
- Tạo mới `.env.example` — template biến môi trường với hướng dẫn

**TASK-02 — Dependencies & Project Structure**
- Tạo mới `package.json` với đầy đủ dependencies, scripts, jest config, eslint config
- Cập nhật `.gitignore`, tạo cấu trúc thư mục `functions/routes/`, `functions/middleware/`, `scripts/`, `docs/`, `tests/`

**TASK-03 — Firestore Security Rules & Indexes**
- Tạo mới `firestore.rules` — chặn toàn bộ client-side access
- Tạo mới `firestore.indexes.json` — 7 composite indexes
- Tạo mới `database.rules.json` — chặn client access cho api_keys, sync_status, import_jobs

### Lý do
- Foundation cho toàn bộ project — các TASK tiếp theo đều phụ thuộc vào nhóm này

---

## [TASK-00] 2026-03-28 — Khởi tạo dự án & Lên kế hoạch

### Thay đổi kỹ thuật
- Tạo mới `project_task.md`, `template-task.md`, `project_memory.md`, `Readme.md`, `CHANGE_LOGS.md`, `CHANGE_LOGS_USER.md`
- Phân tích `docs/database-architecture.md` và chia nhỏ thành 16 tasks
- Xây dựng dependency graph và nhóm song song

### Lý do
- Khởi tạo dự án từ tài liệu kiến trúc có sẵn

---
