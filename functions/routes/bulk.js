'use strict';

/**
 * routes/bulk.js — Bulk import & export endpoints
 *
 * POST /contacts/bulk/import  — async bulk import (job tracking qua Realtime DB)
 * GET  /contacts/bulk/export  — export tất cả contacts (JSON hoặc summary)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { getFirestore, getRtdb, FieldValue } = require('../utils/firebase-admin');
const { writeContact } = require('../utils/writeContact');

// ─── POST /contacts/bulk/import ───────────────────────────────────────────────

/**
 * POST /contacts/bulk/import
 * Body: { contacts: [...] } — mảng contact JSON
 *
 * Flow:
 * 1. Tạo job trong Realtime DB: /import_jobs/{jobId}
 * 2. Trả về { jobId } ngay lập tức (non-blocking)
 * 3. Background: process từng contact, cập nhật job progress
 *
 * Giới hạn: tối đa 5000 contacts/request để tránh timeout
 */
router.post('/import', async (req, res) => {
  const { contacts } = req.body || {};

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Body must have contacts array with at least 1 item',
    });
  }

  const MAX_BATCH = 5000;
  if (contacts.length > MAX_BATCH) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Maximum ${MAX_BATCH} contacts per request. Split into multiple requests.`,
    });
  }

  // Tạo job ID
  const jobId = `job_${crypto.randomBytes(8).toString('hex')}`;
  const rtdb = getRtdb();

  const jobData = {
    status: 'pending',
    total: contacts.length,
    done: 0,
    success: 0,
    errors: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedBy: req.apiKey?.name || 'unknown',
  };

  // Ghi job vào Realtime DB
  await rtdb.ref(`import_jobs/${jobId}`).set(jobData);

  // Trả về ngay — không chờ import xong
  res.status(202).json({
    data: {
      jobId,
      total: contacts.length,
      status: 'pending',
    },
    message: `Import job created. Poll GET /contacts/bulk/import/${jobId} for status.`,
  });

  // ── Background processing ──────────────────────────────────────────────────
  // Chạy sau khi response đã gửi
  setImmediate(async () => {
    const CONCURRENCY = 5;
    let done = 0;
    let success = 0;
    let errors = 0;
    const errorList = [];

    await rtdb.ref(`import_jobs/${jobId}`).update({
      status: 'running',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Process theo chunks
    for (let i = 0; i < contacts.length; i += CONCURRENCY) {
      const chunk = contacts.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        chunk.map(contact =>
          writeContact(contact, { isUpdate: false })
        )
      );

      for (let j = 0; j < results.length; j++) {
        done++;
        if (results[j].status === 'fulfilled') {
          success++;
        } else {
          errors++;
          errorList.push({
            index: i + j,
            error: results[j].reason?.message || 'Unknown error',
          });
        }
      }

      // Cập nhật progress mỗi 50 contacts
      if (done % 50 === 0 || done === contacts.length) {
        await rtdb.ref(`import_jobs/${jobId}`).update({
          done,
          success,
          errors,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Cập nhật meta/stats
    if (success > 0) {
      try {
        const db = getFirestore();
        await db.collection('meta').doc('stats').set(
          {
            totalContacts: FieldValue.increment(success),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('[bulk/import] Failed to update meta/stats:', e.message);
      }
    }

    // Final job update
    const finalStatus = errors === contacts.length ? 'failed'
      : errors > 0 ? 'partial'
      : 'completed';

    await rtdb.ref(`import_jobs/${jobId}`).update({
      status: finalStatus,
      done,
      success,
      errors,
      errorSample: errorList.slice(0, 10), // Lưu tối đa 10 errors
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[bulk/import] Job ${jobId} ${finalStatus}: ${success} success, ${errors} errors`);
  });
});

/**
 * GET /contacts/bulk/import/:jobId — kiểm tra trạng thái import job
 */
router.get('/import/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    const rtdb = getRtdb();
    const snap = await rtdb.ref(`import_jobs/${jobId}`).get();

    if (!snap.exists()) {
      return res.status(404).json({ error: 'Not Found', message: `Job ${jobId} not found` });
    }

    return res.json({ data: { jobId, ...snap.val() } });
  } catch (err) {
    console.error(`[GET /bulk/import/${jobId}] Error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// ─── GET /contacts/bulk/export ────────────────────────────────────────────────

/**
 * GET /contacts/bulk/export
 * Export tất cả contacts (có thể filter)
 *
 * Query params:
 *   ?format=json (default) | summary  — format output
 *   ?category=<cat>  — chỉ export category này
 *   ?limit=<n>       — max số contacts, default 10000
 *   ?includeDetail=true  — kèm contacts_detail (nhiều reads hơn)
 *
 * Lưu ý: Với 30K contacts, nên dùng cursor pagination thay vì export 1 lần
 * File này cung cấp endpoint export cơ bản — production nên implement streaming
 */
router.get('/export', async (req, res) => {
  const format = req.query.format || 'json';
  const category = req.query.category || null;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10000, 30000);
  const includeDetail = req.query.includeDetail === 'true';

  try {
    const db = getFirestore();
    let q = db.collection('contacts_index').orderBy('updatedAt', 'desc');

    if (category) {
      q = q.where('categories', 'array-contains', category);
    }

    q = q.limit(limit);

    const snap = await q.get();
    const indexDocs = snap.docs.map(d => d.data());

    let data = indexDocs;

    if (includeDetail) {
      // Fetch details song song — nhóm 10 để tránh quá nhiều concurrent
      const CHUNK = 10;
      const allDetails = [];

      for (let i = 0; i < indexDocs.length; i += CHUNK) {
        const chunk = indexDocs.slice(i, i + CHUNK);
        const detailSnaps = await Promise.all(
          chunk.map(d => db.collection('contacts_detail').doc(d.id).get())
        );
        for (const dSnap of detailSnaps) {
          allDetails.push(dSnap.exists ? dSnap.data() : null);
        }
      }

      data = indexDocs.map((idx, i) => ({
        ...idx,
        detail: allDetails[i],
      }));
    }

    if (format === 'summary') {
      // Trả về summary thống kê thay vì full data
      const summary = {
        totalExported: data.length,
        hasUserDefined: data.filter(d => d.hasUserDefined).length,
        categories: {},
        domains: {},
        exportedAt: new Date().toISOString(),
      };

      for (const c of data) {
        for (const cat of (c.categories || [])) {
          summary.categories[cat] = (summary.categories[cat] || 0) + 1;
        }
        for (const domain of (c.allDomains || [])) {
          summary.domains[domain] = (summary.domains[domain] || 0) + 1;
        }
      }

      // Sort domains by count
      summary.topDomains = Object.entries(summary.domains)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([domain, count]) => ({ domain, count }));

      delete summary.domains;
      return res.json({ data: summary });
    }

    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contacts_export_${new Date().toISOString().slice(0, 10)}.json"`
    );

    return res.json({
      data,
      meta: {
        total: data.length,
        exportedAt: new Date().toISOString(),
        includesDetail: includeDetail,
        category: category || 'all',
      },
    });
  } catch (err) {
    console.error('[GET /contacts/bulk/export] Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
