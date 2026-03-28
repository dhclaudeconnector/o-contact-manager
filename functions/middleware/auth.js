'use strict';

/**
 * middleware/auth.js — API Key authentication middleware
 *
 * Flow:
 *   1. Đọc header: Authorization: Bearer <key>
 *   2. SHA-256 hash key
 *   3. Lookup hash trong Realtime DB: /api_keys/{keyHash}
 *   4. Kiểm tra active status + optional expiry
 *   5. Attach keyData vào req.apiKey nếu hợp lệ
 *
 * Lưu ý: Admin SDK bypass Firestore rules → chỉ cần validate key là đủ
 */

const crypto = require('crypto');
const { getRtdb } = require('../utils/firebase-admin');

/**
 * Hash API key bằng SHA-256 (hex)
 * @param {string} key
 * @returns {string}
 */
function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Express middleware: xác thực API key
 * Attach req.apiKey = { hash, name, createdAt, ... } nếu hợp lệ
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header. Use: Bearer <api-key>',
    });
  }

  const key = authHeader.slice(7).trim();
  if (!key) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Empty API key',
    });
  }

  try {
    const keyHash = hashKey(key);
    const rtdb = getRtdb();
    const snap = await rtdb.ref(`api_keys/${keyHash}`).get();

    if (!snap.exists()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    }

    const keyData = snap.val();

    // Kiểm tra active
    if (keyData.active === false) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key has been revoked',
      });
    }

    // Kiểm tra expiry (nếu có)
    if (keyData.expiresAt) {
      const expiry = new Date(keyData.expiresAt);
      if (expiry < new Date()) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'API key has expired',
        });
      }
    }

    // Attach keyData vào request
    req.apiKey = { hash: keyHash, ...keyData };

    // Cập nhật lastUsedAt (async, không block request)
    rtdb.ref(`api_keys/${keyHash}/lastUsedAt`)
      .set(new Date().toISOString())
      .catch(() => {}); // silent fail

    next();
  } catch (err) {
    console.error('[auth] Error validating API key:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate API key',
    });
  }
}

module.exports = { authMiddleware, hashKey };
