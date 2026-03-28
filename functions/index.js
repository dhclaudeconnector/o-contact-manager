'use strict';

/**
 * functions/index.js — Express app entry point
 *
 * Chạy standalone:
 *   node functions/index.js
 *   PORT=3000 node functions/index.js
 *
 * Hoặc dùng với nodemon:
 *   npm run dev
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { authMiddleware } = require('./middleware/auth');
const contactsRouter = require('./routes/contacts');
const lookupRouter = require('./routes/lookup');
const bulkRouter = require('./routes/bulk');
const metaRouter = require('./routes/meta');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// CORS — cho phép mọi origin (self-hosted, chỉ bảo vệ bởi API key)
app.use(cors());

// JSON body parser — giới hạn 10MB cho bulk import
app.use(express.json({ limit: '10mb' }));

// Request logger (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Public Routes (không cần auth) ──────────────────────────────────────────

/**
 * GET /health
 * Health check — kiểm tra server có chạy không
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV || 'development',
  });
});

// ─── Protected Routes (cần API key) ──────────────────────────────────────────

// Áp dụng auth middleware cho tất cả /contacts/* routes
app.use('/contacts', authMiddleware);

// Mount routers — thứ tự quan trọng:
// lookup và bulk phải mount TRƯỚC contacts (/:id) để tránh conflict với params
app.use('/contacts', lookupRouter);   // /contacts/by-email/:email, /contacts/by-ud-key/:key, /contacts/ud-keys
app.use('/contacts/bulk', bulkRouter); // /contacts/bulk/import, /contacts/bulk/export
app.use('/contacts/meta', metaRouter); // /contacts/meta/stats
app.use('/contacts', contactsRouter);  // /contacts, /contacts/:id

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found. Check the API documentation.',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Express] Unhandled error:', err);

  // Xử lý JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON in request body',
    });
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body exceeds 10MB limit',
    });
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT, 10) || 3000;

app.listen(PORT, () => {
  console.log(`✅ Contact Manager API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Firebase project: ${process.env.FIREBASE_PROJECT_ID || '(not set)'}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
