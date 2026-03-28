# Project Memory — Self-hosted Contact Manager

> Cập nhật: 2026-03-28 | Task hoàn thành gần nhất: TASK-01, TASK-02, TASK-03
> Agent đọc file này để nắm toàn bộ context và tiếp tục làm việc

---

## Tổng quan project

**Tên project:** contacts-selfhost  
**Mục đích:** Quản lý danh bạ cá nhân self-hosted với ~30,000 contacts  
**Tech stack:**
- Backend: Firebase Firestore + Realtime Database
- API Layer: Express.js / Cloud Functions + Firebase Admin SDK
- Auth: API Key (hash lưu trong Realtime Database)
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
- `/api_keys/{keyHash}` — API key management
- `/sync_status` — trạng thái sync
- `/import_jobs/{jobId}` — bulk import progress

### Encoding rule cho document IDs của lookup collections
- Dấu `.` thay bằng `,`
- Ví dụ: `"gitea.token"` → doc ID: `"gitea,token"`
- Ví dụ: `"ongtrieuhau@gmail.com"` → doc ID: `"ongtrieuhau@gmail,com"`

---

## Trạng thái tasks

### Đã hoàn thành
- TASK-01: Khởi tạo Firebase & cấu hình môi trường ✅
- TASK-02: Cài đặt dependencies & cấu trúc thư mục ✅
- TASK-03: Firestore Security Rules & Indexes ✅

### Chưa thực hiện
- TASK-04: `contactMapper.js`
- TASK-05: `writeContact.js`
- TASK-06: `pagination.js`
- TASK-07: `routes/contacts.js`
- TASK-08: `routes/lookup.js`
- TASK-09: `routes/bulk.js` & `routes/meta.js`
- TASK-10: `middleware/auth.js`
- TASK-11: `functions/index.js`
- TASK-12: `scripts/vcf2json.js`
- TASK-13: `scripts/import.js`
- TASK-14: `scripts/migrate-v2.js`
- TASK-15: Tests & API docs
- TASK-16: Deploy production

**Task tiếp theo nên làm:** TASK-04, TASK-05, TASK-06, TASK-10, TASK-12 (có thể làm song song — Đợt 2)

---

## Cấu trúc file hiện tại

```
contacts-selfhost/
├── functions/
│   ├── utils/
│   │   ├── firebase-admin.js         ✅ [TASK-01] Firebase singleton init
│   │   ├── contactMapper.js          🔲 [TASK-04] placeholder
│   │   ├── writeContact.js           🔲 [TASK-05] placeholder
│   │   ├── searchTokens.js           🔲 [TASK-04] placeholder
│   │   └── pagination.js             🔲 [TASK-06] placeholder
│   ├── routes/                       (thư mục trống — TASK-07,08,09)
│   └── middleware/                   (thư mục trống — TASK-10)
│
├── scripts/                          (thư mục trống — TASK-10,12,13,14)
├── docs/                             (thư mục trống — TASK-15)
├── tests/                            (thư mục trống — TASK-15)
│
├── firestore.rules                   ✅ [TASK-03]
├── firestore.indexes.json            ✅ [TASK-03] 7 composite indexes
├── database.rules.json               ✅ [TASK-03]
├── firebase.json                     ✅ [TASK-01]
├── package.json                      ✅ [TASK-02]
├── .env.example                      ✅ [TASK-01]
├── .gitignore                        ✅ [TASK-02]
│
├── .opushforce.message               ✅ auto-updated
├── CHANGE_LOGS.md                    ✅ auto-updated
├── CHANGE_LOGS_USER.md               ✅ auto-updated
├── project_memory.md                 ✅ (file này)
├── project_task.md                   ✅ trạng thái updated
├── template-task.md
└── Readme.md
```

---

## Quyết định kỹ thuật đã chốt

1. **Atomic batch write:** Mỗi contact write = 1 Firestore batch (index + detail + email_lookup + ud_key_lookup)
2. **Search tokens:** Prefix ngrams từ ký tự thứ 2 trở đi, NFD normalize để hỗ trợ tiếng Việt
3. **Email encoding:** lowercase trước khi lưu
4. **Pagination:** Cursor-based (không dùng offset — kém hiệu quả với Firestore)
5. **Không query `contacts_detail` để làm danh sách** — chỉ query `contacts_index`
6. **API Key hashing:** Lưu hash của key trong Realtime DB, không lưu key gốc
7. **CommonJS (`require`):** Toàn bộ project dùng `'use strict'` + CommonJS — không dùng ESM (tương thích Cloud Functions)
8. **`nanoid@^3`:** Dùng v3 (CommonJS) — v4+ chỉ có ESM

---

## Cấu hình cần thiết khi setup

```env
# .env (không commit lên git)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
# hoặc
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

PORT=3000
NODE_ENV=development
```

Sau khi copy `.env.example` → `.env`, cần chạy:
```bash
npm install
```

---

## Ghi chú quan trọng cho agent

- **Luôn đọc `docs/database-architecture.md`** khi implement — đây là source of truth
- **Schema của `contacts_index` phải ≤ 1KB/doc** — không thêm field nặng vào đây
- **`ud_key_lookup` count field** có thể bị lệch nếu chạy migrate nhiều lần — known limitation
- **Firestore batch limit = 500 operations** — migrate script dùng 400 docs/batch để an toàn
- **Test với data mẫu** trước khi chạy migration trên 30K contacts thật
- **`nanoid` phải dùng v3** (CommonJS) — import: `const { nanoid } = require('nanoid')`
- **`firebase-admin` singleton** — `getFirestore()` và `getRtdb()` trả về cùng instance, gọi nhiều lần an toàn
- **TASK-04 là prerequisite quan trọng** — contactMapper phải xong trước writeContact (TASK-05) và import (TASK-13)
