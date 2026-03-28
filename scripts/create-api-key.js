#!/usr/bin/env node
'use strict';

/**
 * scripts/create-api-key.js — Tạo API key mới và lưu vào Realtime DB
 *
 * Usage:
 *   node scripts/create-api-key.js
 *   node scripts/create-api-key.js --name "My App" --expires 2027-01-01
 *   node scripts/create-api-key.js --list
 *   node scripts/create-api-key.js --revoke <keyHash>
 */

require('dotenv').config();

const crypto = require('crypto');
const { getRtdb } = require('../functions/utils/firebase-admin');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateKey() {
  // Format: cm_<32 bytes random hex> — dễ nhận biết là contact manager key
  return 'cm_' + crypto.randomBytes(32).toString('hex');
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--list') args.list = true;
    else if (arg === '--name') args.name = argv[++i];
    else if (arg === '--expires') args.expires = argv[++i];
    else if (arg === '--revoke') args.revoke = argv[++i];
  }
  return args;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function createKey(name, expiresAt) {
  const key = generateKey();
  const keyHash = hashKey(key);
  const rtdb = getRtdb();

  const keyData = {
    name: name || `key_${Date.now()}`,
    active: true,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt: expiresAt || null,
  };

  // Bỏ null fields
  if (!keyData.expiresAt) delete keyData.expiresAt;
  if (!keyData.lastUsedAt) delete keyData.lastUsedAt;

  await rtdb.ref(`api_keys/${keyHash}`).set(keyData);

  console.log('\n✅ API Key created successfully!\n');
  console.log('━'.repeat(60));
  console.log(`  Key:   ${key}`);
  console.log(`  Hash:  ${keyHash}`);
  console.log(`  Name:  ${keyData.name}`);
  if (expiresAt) console.log(`  Expires: ${expiresAt}`);
  console.log('━'.repeat(60));
  console.log('\n⚠️  Lưu key này lại — sẽ không thể xem lại sau này!\n');
  console.log('📋 Dùng trong API request:');
  console.log(`   Authorization: Bearer ${key}\n`);
}

async function listKeys() {
  const rtdb = getRtdb();
  const snap = await rtdb.ref('api_keys').get();

  if (!snap.exists()) {
    console.log('\n📭 Không có API key nào.\n');
    return;
  }

  const keys = snap.val();
  console.log('\n📋 Danh sách API Keys:\n');
  console.log('━'.repeat(80));

  for (const [hash, data] of Object.entries(keys)) {
    const status = data.active === false ? '❌ REVOKED' : '✅ ACTIVE';
    const expired = data.expiresAt && new Date(data.expiresAt) < new Date()
      ? ' (EXPIRED)' : '';
    console.log(`${status}${expired}`);
    console.log(`  Hash:      ${hash}`);
    console.log(`  Name:      ${data.name}`);
    console.log(`  Created:   ${data.createdAt}`);
    if (data.lastUsedAt) console.log(`  Last used: ${data.lastUsedAt}`);
    if (data.expiresAt) console.log(`  Expires:   ${data.expiresAt}`);
    console.log('');
  }
  console.log('━'.repeat(80));
}

async function revokeKey(keyHash) {
  const rtdb = getRtdb();
  const snap = await rtdb.ref(`api_keys/${keyHash}`).get();

  if (!snap.exists()) {
    console.error(`\n❌ Không tìm thấy key với hash: ${keyHash}\n`);
    process.exit(1);
  }

  await rtdb.ref(`api_keys/${keyHash}/active`).set(false);
  console.log(`\n✅ Đã revoke key: ${keyHash}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  try {
    if (args.list) {
      await listKeys();
    } else if (args.revoke) {
      await revokeKey(args.revoke);
    } else {
      await createKey(args.name, args.expires);
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
