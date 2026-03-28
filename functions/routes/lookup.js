'use strict';

/**
 * routes/lookup.js — Reverse lookup endpoints
 *
 * GET /contacts/by-email/:email   — email → contactId + detail  (O1, ~3 reads)
 * GET /contacts/by-ud-key/:key    — udKey → all contacts        (1+N reads)
 * GET /contacts/ud-keys           — list all unique keys        (~10-30 reads)
 */

const express = require('express');
const router = express.Router();

const { getFirestore } = require('../utils/firebase-admin');
const { encodeDocId } = require('../utils/contactMapper');

// ─── GET /contacts/by-email/:email ───────────────────────────────────────────

/**
 * GET /contacts/by-email/:email
 * Lookup contact theo email bất kỳ (primary hoặc phụ)
 * 1. Tra email_lookup/{encoded_email} → contactId  (1 read)
 * 2. Đọc contacts_index/{contactId}               (1 read)
 * 3. Đọc contacts_detail/{contactId}              (1 read, optional)
 * Total: 3 reads
 */
router.get('/by-email/:email', async (req, res) => {
  let { email } = req.params;
  email = decodeURIComponent(email).toLowerCase().trim();

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid email format',
    });
  }

  try {
    const db = getFirestore();
    const docId = encodeDocId(email);

    // 1. Tra email_lookup
    const lookupSnap = await db.collection('email_lookup').doc(docId).get();

    if (!lookupSnap.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No contact found with email: ${email}`,
      });
    }

    const { contactId, isPrimary, type, label } = lookupSnap.data();

    // 2 + 3. Đọc index + detail song song
    const includeDetail = req.query.detail !== 'false';
    const fetches = [db.collection('contacts_index').doc(contactId).get()];
    if (includeDetail) fetches.push(db.collection('contacts_detail').doc(contactId).get());

    const [indexSnap, detailSnap] = await Promise.all(fetches);

    if (!indexSnap.exists) {
      // Data inconsistency — email_lookup tồn tại nhưng contact không có
      return res.status(404).json({
        error: 'Not Found',
        message: `Contact ${contactId} referenced by email lookup no longer exists`,
      });
    }

    return res.json({
      data: {
        ...indexSnap.data(),
        detail: detailSnap && detailSnap.exists ? detailSnap.data() : null,
        matchedEmail: { email, isPrimary, type, label },
      },
    });
  } catch (err) {
    console.error(`[GET /contacts/by-email/${req.params.email}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /contacts/by-ud-key/:key ────────────────────────────────────────────

/**
 * GET /contacts/by-ud-key/:key
 * Tất cả contacts có userDefined key này
 * 1. Tra ud_key_lookup/{encoded_key} → contactIds[]  (1 read)
 * 2. Đọc contacts_index cho từng contactId           (N reads)
 * Total: 1+N reads
 *
 * Query params:
 *   ?detail=true  — cũng đọc contacts_detail (thêm N reads)
 */
router.get('/by-ud-key/:key', async (req, res) => {
  const { key } = req.params;
  const decodedKey = decodeURIComponent(key).trim();

  if (!decodedKey) {
    return res.status(400).json({ error: 'Bad Request', message: 'Key cannot be empty' });
  }

  const includeDetail = req.query.detail === 'true';

  try {
    const db = getFirestore();
    const docId = encodeDocId(decodedKey);

    // 1. Tra ud_key_lookup
    const lookupSnap = await db.collection('ud_key_lookup').doc(docId).get();

    if (!lookupSnap.exists) {
      return res.json({
        data: [],
        meta: { key: decodedKey, count: 0 },
      });
    }

    const { contactIds = [], count } = lookupSnap.data();

    if (!contactIds.length) {
      return res.json({
        data: [],
        meta: { key: decodedKey, count: 0 },
      });
    }

    // 2. Đọc contacts_index song song
    const indexSnaps = await Promise.all(
      contactIds.map(cid => db.collection('contacts_index').doc(cid).get())
    );

    let detailSnapsMap = {};
    if (includeDetail) {
      const detailSnaps = await Promise.all(
        contactIds.map(cid => db.collection('contacts_detail').doc(cid).get())
      );
      for (let i = 0; i < contactIds.length; i++) {
        if (detailSnaps[i].exists) {
          detailSnapsMap[contactIds[i]] = detailSnaps[i].data();
        }
      }
    }

    const data = indexSnaps
      .filter(snap => snap.exists)
      .map(snap => {
        const d = snap.data();
        // Lấy giá trị của key này từ detail nếu có
        const detail = detailSnapsMap[snap.id];
        const udValue = detail?.userDefined?.[decodedKey];
        return {
          ...d,
          ...(includeDetail && detail ? { detail } : {}),
          matchedUdKey: {
            key: decodedKey,
            value: udValue !== undefined ? udValue : null,
          },
        };
      });

    return res.json({
      data,
      meta: {
        key: decodedKey,
        count: data.length,
        storedCount: count || contactIds.length,
      },
    });
  } catch (err) {
    console.error(`[GET /contacts/by-ud-key/${req.params.key}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /contacts/ud-keys ────────────────────────────────────────────────────

/**
 * GET /contacts/ud-keys
 * Liệt kê tất cả unique userDefined keys trong hệ thống
 * Đọc toàn bộ ud_key_lookup collection (~10-30 docs)
 *
 * Query params:
 *   ?sort=count|key   — sắp xếp theo count hoặc tên key (default: count)
 *   ?order=asc|desc   — default: desc
 *   ?search=<string>  — filter theo tên key (prefix match)
 */
router.get('/ud-keys', async (req, res) => {
  const sort = req.query.sort === 'key' ? 'key' : 'count';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const search = (req.query.search || '').toLowerCase().trim();

  try {
    const db = getFirestore();
    const snap = await db.collection('ud_key_lookup').get();

    let keys = snap.docs
      .map(doc => ({
        key: doc.data().key,
        count: doc.data().count || 0,
        contactIds: doc.data().contactIds || [],
        updatedAt: doc.data().updatedAt,
      }))
      .filter(k => k.contactIds.length > 0); // Bỏ qua keys không còn contact nào

    // Filter by search
    if (search) {
      keys = keys.filter(k => k.key.toLowerCase().startsWith(search));
    }

    // Sort
    keys.sort((a, b) => {
      let cmp = 0;
      if (sort === 'count') {
        cmp = a.count - b.count;
      } else {
        cmp = a.key.localeCompare(b.key);
      }
      return order === 'desc' ? -cmp : cmp;
    });

    return res.json({
      data: keys.map(k => ({
        key: k.key,
        count: k.contactIds.length, // Dùng length thực tế thay vì stored count
        updatedAt: k.updatedAt,
      })),
      meta: { total: keys.length, sort, order },
    });
  } catch (err) {
    console.error('[GET /contacts/ud-keys] Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
