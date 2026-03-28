'use strict';

const admin = require('firebase-admin');
const path = require('path');

/**
 * Firebase Admin SDK — Singleton initialization
 * Hỗ trợ 2 cách auth:
 *   1. GOOGLE_APPLICATION_CREDENTIALS (env var trỏ tới service account JSON)
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH   (custom env var)
 */

let _db = null;
let _rtdb = null;
let _initialized = false;

function initFirebase() {
  if (_initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing env: FIREBASE_PROJECT_ID');
  }

  // Nếu chưa có app nào, khởi tạo mới
  if (!admin.apps.length) {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let credential;
    if (serviceAccountPath) {
      const resolvedPath = path.resolve(serviceAccountPath);
      // eslint-disable-next-line import/no-dynamic-require
      const serviceAccount = require(resolvedPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Fallback: Application Default Credentials (Cloud Functions, Cloud Run)
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
      projectId,
      databaseURL: process.env.FIREBASE_DATABASE_URL ||
        `https://${projectId}-default-rtdb.firebaseio.com`,
    });
  }

  _initialized = true;
}

/**
 * Trả về Firestore instance
 * @returns {FirebaseFirestore.Firestore}
 */
function getFirestore() {
  if (!_db) {
    initFirebase();
    _db = admin.firestore();
    // Timestamps trả về là Firestore Timestamp object (không tự convert sang Date)
    _db.settings({ ignoreUndefinedProperties: true });
  }
  return _db;
}

/**
 * Trả về Realtime Database instance
 * @returns {admin.database.Database}
 */
function getRtdb() {
  if (!_rtdb) {
    initFirebase();
    _rtdb = admin.database();
  }
  return _rtdb;
}

/**
 * Trả về FieldValue helpers
 */
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = {
  getFirestore,
  getRtdb,
  FieldValue,
  Timestamp,
  admin,
};
