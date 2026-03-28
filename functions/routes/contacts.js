'use strict';

/**
 * routes/contacts.js — CRUD endpoints cho contacts
 *
 * GET    /contacts          — list + search + filter (cursor pagination)
 * GET    /contacts/:id      — chi tiết 1 contact (index + detail)
 * POST   /contacts          — tạo mới
 * PUT    /contacts/:id      — cập nhật toàn bộ
 * PATCH  /contacts/:id      — cập nhật từng phần (merge)
 * DELETE /contacts/:id      — xóa
 */

const express = require('express');
const router = express.Router();

const { getFirestore, FieldValue } = require('../utils/firebase-admin');
const { writeContact, deleteContact } = require('../utils/writeContact');
const { parseQueryParams, paginateQuery, buildListResponse } = require('../utils/pagination');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Cập nhật meta/stats khi tạo mới hoặc xóa contact
 * @param {'increment'|'decrement'} direction
 */
async function updateStats(direction) {
  const db = getFirestore();
  const delta = direction === 'increment' ? 1 : -1;
  try {
    await db.collection('meta').doc('stats').set(
      {
        totalContacts: FieldValue.increment(delta),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    // Non-critical — log and continue
    console.warn('[contacts] Failed to update meta/stats:', err.message);
  }
}

// ─── GET /contacts ────────────────────────────────────────────────────────────

/**
 * GET /contacts
 * Query params: search, category, domain, email, udKey, hasUD, sort, order, limit, cursor
 */
router.get('/', async (req, res) => {
  try {
    const params = parseQueryParams(req.query);

    // Validate search min length
    if (params.search && params.search.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'search must be at least 2 characters',
      });
    }

    const result = await paginateQuery(params);
    return res.json(buildListResponse(result, params));
  } catch (err) {
    console.error('[GET /contacts] Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /contacts/:id ────────────────────────────────────────────────────────

/**
 * GET /contacts/:id
 * Trả về index + detail (2 reads)
 * Query: ?detail=false để chỉ trả về index doc
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const includeDetail = req.query.detail !== 'false';

  try {
    const db = getFirestore();

    if (includeDetail) {
      // Fetch cả 2 docs song song
      const [indexSnap, detailSnap] = await Promise.all([
        db.collection('contacts_index').doc(id).get(),
        db.collection('contacts_detail').doc(id).get(),
      ]);

      if (!indexSnap.exists) {
        return res.status(404).json({ error: 'Not Found', message: `Contact ${id} not found` });
      }

      return res.json({
        data: {
          ...indexSnap.data(),
          detail: detailSnap.exists ? detailSnap.data() : null,
        },
      });
    } else {
      const indexSnap = await db.collection('contacts_index').doc(id).get();
      if (!indexSnap.exists) {
        return res.status(404).json({ error: 'Not Found', message: `Contact ${id} not found` });
      }
      return res.json({ data: indexSnap.data() });
    }
  } catch (err) {
    console.error(`[GET /contacts/${id}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── POST /contacts ───────────────────────────────────────────────────────────

/**
 * POST /contacts
 * Body: contact JSON (flat hoặc wrapped format)
 * Trả về: { data: { contactId, emailCount, udKeyCount } }
 */
router.post('/', async (req, res) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Request body is required' });
  }

  // Validate displayName hoặc có email
  const contactData = body.contact || body;
  const hasName = contactData.displayName || contactData.fn || contactData.name;
  const hasEmail = Array.isArray(contactData.emails)
    ? contactData.emails.length > 0
    : !!contactData.email;

  if (!hasName && !hasEmail) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Contact must have at least a displayName or an email',
    });
  }

  try {
    const result = await writeContact(body, { isUpdate: false });
    await updateStats('increment');

    return res.status(201).json({
      data: {
        contactId: result.contactId,
        emailCount: result.emailCount,
        udKeyCount: result.udKeyCount,
      },
      message: 'Contact created successfully',
    });
  } catch (err) {
    console.error('[POST /contacts] Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── PUT /contacts/:id ────────────────────────────────────────────────────────

/**
 * PUT /contacts/:id
 * Overwrite toàn bộ contact — cleanup email/udKey lookups cũ
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Request body is required' });
  }

  try {
    const db = getFirestore();
    const snap = await db.collection('contacts_index').doc(id).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Not Found', message: `Contact ${id} not found` });
    }

    const result = await writeContact(body, {
      contactId: id,
      isUpdate: true,
    });

    return res.json({
      data: {
        contactId: result.contactId,
        emailCount: result.emailCount,
        udKeyCount: result.udKeyCount,
      },
      message: 'Contact updated successfully',
    });
  } catch (err) {
    console.error(`[PUT /contacts/${id}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── PATCH /contacts/:id ──────────────────────────────────────────────────────

/**
 * PATCH /contacts/:id
 * Merge fields — đọc contact hiện tại, merge với body, rồi write lại
 * Hỗ trợ partial updates: chỉ cần gửi fields cần thay đổi
 */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Request body is required' });
  }

  try {
    const db = getFirestore();

    // Đọc detail để merge
    const [indexSnap, detailSnap] = await Promise.all([
      db.collection('contacts_index').doc(id).get(),
      db.collection('contacts_detail').doc(id).get(),
    ]);

    if (!indexSnap.exists) {
      return res.status(404).json({ error: 'Not Found', message: `Contact ${id} not found` });
    }

    const existing = detailSnap.exists ? detailSnap.data() : {};

    // Merge strategy:
    // - Top level: spread existing + body
    // - contact object: deep merge
    // - userDefined: merge (không xóa keys cũ trừ khi set null)
    const existingContact = existing.contact || {};
    const existingUD = existing.userDefined || {};

    const patchContact = body.contact || {};
    const patchUD = body.userDefined || {};

    // Merge userDefined: xóa keys có value = null
    const mergedUD = { ...existingUD, ...patchUD };
    for (const key of Object.keys(mergedUD)) {
      if (mergedUD[key] === null || mergedUD[key] === undefined) {
        delete mergedUD[key];
      }
    }

    const merged = {
      contact: {
        ...existingContact,
        ...patchContact,
        // Merge nested arrays nếu có
        emails: patchContact.emails || existingContact.emails,
        phones: patchContact.phones || existingContact.phones,
        categories: patchContact.categories || existingContact.categories,
      },
      userDefined: mergedUD,
      vcfRaw: body.vcfRaw || existing.vcfRaw || undefined,
    };

    const result = await writeContact(merged, {
      contactId: id,
      isUpdate: true,
    });

    return res.json({
      data: {
        contactId: result.contactId,
        emailCount: result.emailCount,
        udKeyCount: result.udKeyCount,
      },
      message: 'Contact patched successfully',
    });
  } catch (err) {
    console.error(`[PATCH /contacts/${id}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── DELETE /contacts/:id ─────────────────────────────────────────────────────

/**
 * DELETE /contacts/:id
 * Xóa contact + cleanup tất cả lookup docs
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteContact(id);
    await updateStats('decrement');

    return res.json({
      data: result,
      message: 'Contact deleted successfully',
    });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ error: 'Not Found', message: err.message });
    }
    console.error(`[DELETE /contacts/${id}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
