## [TASK-01,02,03] 2026-03-28 — Khởi tạo Firebase, Dependencies & Security Rules

### Thay đổi kỹ thuật

**TASK-01 — Firebase Admin SDK init**
- Tạo mới `functions/utils/firebase-admin.js` — singleton pattern, lazy init
  - Hỗ trợ 2 cách auth: `FIREBASE_SERVICE_ACCOUNT_PATH` hoặc `GOOGLE_APPLICATION_CREDENTIALS`
  - Fallback sang Application Default Credentials (dùng được trên Cloud Functions/Cloud Run)
  - Export: `getFirestore()`, `getRtdb()`, `FieldValue`, `Timestamp`, `admin`
- Tạo mới `firebase.json` — cấu hình Firestore rules/indexes, Realtime DB rules, Functions runtime nodejs18, Emulators (ports: auth 9099, functions 5001, firestore 8080, db 9000, ui 4000)
- Tạo mới `.env.example` — template biến môi trường với hướng dẫn

**TASK-02 — Dependencies & Project Structure**
- Tạo mới `package.json`:
  - Dependencies: `firebase-admin@^12`, `express@^4`, `nanoid@^3`, `cors@^2`, `dotenv@^16`
  - DevDependencies: `eslint@^8`, `jest@^29`, `nodemon@^3`
  - Scripts: `start`, `dev`, `test`, `lint`, `import`, `migrate`, `create-key`, `deploy:rules`, `deploy`
  - Jest config: testMatch `tests/**/*.test.js`
  - ESLint config inline (node + es2022)
- Cập nhật `.gitignore` — thêm Firebase debug logs, `.firebase/`, bổ sung pattern secrets
- Tạo cấu trúc thư mục:
  - `functions/routes/`, `functions/middleware/`, `functions/utils/`
  - `scripts/`, `docs/`, `tests/`
- Tạo placeholder files (TASK-04~06): `contactMapper.js`, `searchTokens.js`, `writeContact.js`, `pagination.js`

**TASK-03 — Firestore Security Rules & Indexes**
- Tạo mới `firestore.rules` — chặn toàn bộ client-side read/write (`allow read, write: if false`); Admin SDK bypass rules → chỉ backend được truy cập
- Tạo mới `firestore.indexes.json` — 7 composite indexes:
  1. `searchTokens CONTAINS` + `updatedAt DESC`
  2. `categories CONTAINS` + `updatedAt DESC`
  3. `allEmails CONTAINS` + `updatedAt DESC`
  4. `allDomains CONTAINS` + `updatedAt DESC`
  5. `userDefinedKeys CONTAINS` + `updatedAt DESC`
  6. `categories CONTAINS` + `userDefinedKeys CONTAINS` + `updatedAt DESC`
  7. `emailDomain ASC` + `displayName ASC`
- Tạo mới `database.rules.json` — chặn toàn bộ client access cho: `api_keys`, `sync_status`, `import_jobs`

### Lý do
- Foundation cho toàn bộ project — các TASK tiếp theo đều phụ thuộc vào nhóm này
- Admin SDK singleton tránh khởi tạo nhiều lần trong môi trường Cloud Functions
- Rules bảo vệ data ngay từ đầu — không để lộ Firestore khi test
- 7 indexes đủ để support tất cả query patterns trong `docs/database-architecture.md` section 5

---

## [TASK-00] 2026-03-28 — Khởi tạo dự án & Lên kế hoạch

### Thay đổi kỹ thuật
- Tạo mới `project_task.md` — danh sách 16 tasks với dependency graph, trạng thái, output files
- Tạo mới `template-task.md` — quy trình chuẩn cho agent thực hiện tasks
- Tạo mới `project_memory.md` — context toàn bộ project cho agent
- Tạo mới `Readme.md` — tài liệu dự án
- Tạo mới `CHANGE_LOGS.md` (file này)
- Tạo mới `CHANGE_LOGS_USER.md`
- Phân tích `docs/database-architecture.md` và chia nhỏ thành 16 tasks
- Xác định 6 nhóm task (Foundation, Core Utils, API Routes, Middleware, Scripts, Testing)
- Xây dựng dependency graph và nhóm song song

### Lý do
- Khởi tạo dự án từ tài liệu kiến trúc có sẵn
- Cần kế hoạch chi tiết để thực hiện tuần tự và song song hiệu quả

---
