'use strict';

/**
 * routes/meta.js — Metadata & statistics endpoints
 *
 * GET /contacts/meta/stats  — thống kê tổng (1 read)
 */

const express = require('express');
const router = express.Router();

const { getFirestore, FieldValue } = require('../utils/firebase-admin');

/**
 * GET /contacts/meta/stats
 * Đọc doc meta/stats từ Firestore (1 read)
 * Nếu doc chưa tồn tại → tính toán lại từ contacts_index (nhiều reads hơn)
 *
 * Query params:
 *   ?refresh=true  — recompute stats từ contacts_index (bỏ qua cached)
 */
router.get('/stats', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';

  try {
    const db = getFirestore();

    if (!forceRefresh) {
      // Đọc cached stats (1 read)
      const snap = await db.collection('meta').doc('stats').get();

      if (snap.exists) {
        return res.json({
          data: snap.data(),
          meta: { cached: true },
        });
      }
    }

    // Recompute: scan toàn bộ contacts_index
    // Chỉ chạy khi force refresh hoặc lần đầu
    console.log('[meta/stats] Recomputing stats from contacts_index...');

    let totalContacts = 0;
    let totalEmails = 0;
    let hasUserDefinedCount = 0;
    const categoryCount = {};

    // Dùng cursor để đọc toàn bộ mà không timeout
    let lastDoc = null;
    const BATCH_SIZE = 500;

    while (true) {
      let q = db.collection('contacts_index')
        .orderBy('createdAt')
        .limit(BATCH_SIZE);

      if (lastDoc) q = q.startAfter(lastDoc);

      const snap = await q.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        const d = doc.data();
        totalContacts++;
        totalEmails += d.emailCount || 0;
        if (d.hasUserDefined) hasUserDefinedCount++;
        for (const cat of (d.categories || [])) {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
      }

      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.docs.length < BATCH_SIZE) break;
    }

    const stats = {
      totalContacts,
      totalEmails,
      hasUserDefinedCount,
      categoryBreakdown: categoryCount,
      updatedAt: new Date().toISOString(),
      computedAt: new Date().toISOString(),
    };

    // Lưu lại cached stats
    await db.collection('meta').doc('stats').set(stats);

    return res.json({
      data: stats,
      meta: { cached: false, recomputed: true },
    });
  } catch (err) {
    console.error('[GET /contacts/meta/stats] Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
