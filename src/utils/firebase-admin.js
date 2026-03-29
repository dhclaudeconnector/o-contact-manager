'use strict';

const admin = require('firebase-admin');
const path = require('path');

let _db = null;
let _rtdb = null;
let _initialized = false;

function initFirebase() {
  if (_initialized) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing env: FIREBASE_PROJECT_ID');
  if (!admin.apps.length) {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;
    let credential;
    if (serviceAccountPath) {
      const resolvedPath = path.resolve(serviceAccountPath);
      const serviceAccount = require(resolvedPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
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

function getFirestore() {
  if (!_db) {
    initFirebase();
    _db = admin.firestore();
    _db.settings({ ignoreUndefinedProperties: true });
  }
  return _db;
}

function getRtdb() {
  if (!_rtdb) {
    initFirebase();
    _rtdb = admin.database();
  }
  return _rtdb;
}

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = { getFirestore, getRtdb, FieldValue, Timestamp, admin };
