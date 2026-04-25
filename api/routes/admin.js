const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// Protect all admin routes
router.use(authMiddleware);

// GET /api/admin/leads
router.get('/leads', async (req, res) => {
  try {
    const db = await getDb();
    const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC');
    res.json({ success: true, leads });
  } catch (err) {
    console.error('[Admin API Error]', err);
    res.status(500).json({ error: 'Server error fetching leads' });
  }
});

// GET /api/admin/meetings
router.get('/meetings', async (req, res) => {
  try {
    const db = await getDb();
    const meetings = await db.all('SELECT * FROM meetings ORDER BY created_at DESC');
    res.json({ success: true, meetings });
  } catch (err) {
    console.error('[Admin API Error]', err);
    res.status(500).json({ error: 'Server error fetching meetings' });
  }
});

module.exports = router;
